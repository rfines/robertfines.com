import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-helpers";

export async function POST() {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  });

  if (!user?.stripeCustomerId) {
    return NextResponse.json({ error: "No active subscription" }, { status: 400 });
  }

  const portalSession = await getStripe().billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${process.env.NEXTAUTH_URL}/dashboard/billing`,
  });

  return NextResponse.json({ url: portalSession.url });
}
