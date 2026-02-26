import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { requireAuth, parseBody } from "@/lib/route-helpers";
import { checkoutSessionSchema } from "@/types";

const VALID_PRICE_IDS = new Set([
  process.env.STRIPE_STARTER_PRICE_ID,
  process.env.STRIPE_PRO_PRICE_ID,
]);

export async function POST(req: Request) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  const { data, error: parseError } = await parseBody(req, checkoutSessionSchema);
  if (parseError) return parseError;

  if (!VALID_PRICE_IDS.has(data.priceId)) {
    return NextResponse.json({ error: "Invalid price ID" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, stripeCustomerId: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Get or create Stripe customer
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
