import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { planFromPriceId } from "@/lib/plan";
import type Stripe from "stripe";

export async function POST(req: Request) {
  const buf = Buffer.from(await req.arrayBuffer());
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;

        const userId = session.metadata?.userId;
        if (!userId) break;

        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;
        if (!subscriptionId) break;

        const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price.id;
        const plan = priceId ? planFromPriceId(priceId) : null;
        if (!plan) break;

        await prisma.user.update({
          where: { id: userId },
          data: {
            plan,
            stripeCustomerId:
              typeof session.customer === "string" ? session.customer : undefined,
          },
        });
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        const priceId = subscription.items.data[0]?.price.id;
        const isActive = subscription.status === "active" || subscription.status === "trialing";
        const plan = isActive && priceId ? planFromPriceId(priceId) : "free";
        if (!plan) break;

        await prisma.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: { plan },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        await prisma.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: { plan: "free" },
        });
        break;
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
