import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { planFromPriceId } from "@/lib/plan";
import type Stripe from "stripe";

export const maxDuration = 30;

export async function POST(req: Request) {
  let buf: Buffer;
  try {
    buf = Buffer.from(await req.arrayBuffer());
  } catch (err) {
    console.error("Webhook: failed to read request body", err);
    return NextResponse.json({ error: "Failed to read body" }, { status: 400 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("Webhook: STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook: signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;

        const userId = session.metadata?.userId;
        if (!userId) {
          console.error("Webhook: checkout.session.completed missing userId metadata", session.id);
          break;
        }

        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;
        if (!subscriptionId) {
          console.error("Webhook: checkout.session.completed missing subscription", session.id);
          break;
        }

        const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price.id;
        const plan = priceId ? planFromPriceId(priceId) : null;
        if (!plan) {
          console.error("Webhook: unknown priceId in checkout.session.completed", priceId);
          break;
        }

        await prisma.user.update({
          where: { id: userId },
          data: {
            plan,
            stripeCustomerId:
              typeof session.customer === "string" ? session.customer : undefined,
          },
        });
        console.log(`Webhook: updated user ${userId} to plan ${plan}`);
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
        if (!plan) {
          console.error("Webhook: unknown priceId in customer.subscription.updated", priceId);
          break;
        }

        await prisma.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: { plan },
        });
        console.log(`Webhook: updated customer ${customerId} to plan ${plan}`);
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
        console.log(`Webhook: reset customer ${customerId} to free`);
        break;
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
