import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { requireAuth, parseBody } from "@/lib/route-helpers";
import { checkoutSessionSchema } from "@/types";
import { planFromPriceId } from "@/lib/plan";

export async function POST(req: Request) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  const { data, error: parseError } = await parseBody(req, checkoutSessionSchema);
  if (parseError) return parseError;

  // Build valid set at request time so env vars are guaranteed to be loaded
  const validPriceIds = new Set(
    [
      process.env.STRIPE_STARTER_PRICE_ID,
      process.env.STRIPE_PRO_PRICE_ID,
      process.env.STRIPE_AGENCY_PRICE_ID,
    ].filter(Boolean)
  );

  if (!validPriceIds.has(data.priceId)) {
    return NextResponse.json({ error: "Invalid price ID" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, stripeCustomerId: true, stripeSubscriptionId: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // ── Plan change: user already has an active subscription ─────────────────
  if (user.stripeSubscriptionId) {
    const subscription = await getStripe().subscriptions.retrieve(
      user.stripeSubscriptionId
    );
    const itemId = subscription.items.data[0]?.id;
    if (!itemId) {
      return NextResponse.json({ error: "Subscription item not found" }, { status: 500 });
    }

    await getStripe().subscriptions.update(user.stripeSubscriptionId, {
      items: [{ id: itemId, price: data.priceId }],
      proration_behavior: "create_prorations",
    });

    // Update the plan immediately so the billing page reflects the change
    // at once; the webhook will also sync this as confirmation.
    const newPlan = planFromPriceId(data.priceId);
    if (newPlan) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { plan: newPlan },
      });
    }

    return NextResponse.json({
      url: `${process.env.NEXTAUTH_URL}/dashboard/billing?success=true`,
    });
  }

  // ── New subscription: get or create Stripe customer then create session ───
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await getStripe().customers.create({
      email: user.email ?? undefined,
      metadata: { userId: session.user.id },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: session.user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const checkoutSession = await getStripe().checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: data.priceId, quantity: 1 }],
    metadata: { userId: session.user.id },
    success_url: `${process.env.NEXTAUTH_URL}/dashboard/billing?success=true`,
    cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/billing`,
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
