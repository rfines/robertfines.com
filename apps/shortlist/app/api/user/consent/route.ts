import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-helpers";

export async function POST(req: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const body = await req.json();
  if (typeof body.consent !== "boolean") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { marketingConsent: body.consent },
  });

  return NextResponse.json({ ok: true });
}
