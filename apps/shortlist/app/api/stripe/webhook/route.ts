import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { planFromPriceId } from "@/lib/plan";
import type Stripe from "stripe";

export const maxDuration = 30;

// Diagnostic — lets us confirm Railway is routing to this handler
export function GET() {
  return NextResponse.json({ ok: true, ts: Date.now() });
}

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
      // Plan assigned when subscription is first created — subscription data
      // is already in the event body, no outbound API call needed.
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        const priceId = subscription.items.data[0]?.price.id;
        const isActive = subscription.status === "active" || subscription.status === "trialing";
        const plan = isActive && priceId ? planFromPriceId(priceId) : null;
        if (!plan) {
          console.error("Webhook: unknown priceId or inactive status in customer.subscription.created", priceId, subscription.status);
          break;
        }

        await prisma.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: { plan },
        });
        console.log(`Webhook: subscription.created — customer ${customerId} → plan ${plan}`);
        break;
      }

      // checkout.session.completed: no outbound API call — just confirm the
      // stripeCustomerId linkage. Plan is set by customer.subscription.created.
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;

        const userId = session.metadata?.userId;
        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : (session.customer as Stripe.Customer | null)?.id;

        if (userId && customerId) {
          await prisma.user.update({
            where: { id: userId },
            data: { stripeCustomerId: customerId },
          });
          console.log(`Webhook: checkout.session.completed — linked customer ${customerId} to user ${userId}`);
        } else {
          console.error("Webhook: checkout.session.completed missing userId or customerId", session.id);
        }
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
        console.log(`Webhook: subscription.updated — customer ${customerId} → plan ${plan}`);
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
        console.log(`Webhook: subscription.deleted — customer ${customerId} → free`);
        break;
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
