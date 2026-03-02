import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, parseBody } from "@/lib/route-helpers";

const consentSchema = z.object({
  consent: z.boolean(),
});

export async function POST(req: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { data, error: parseError } = await parseBody(req, consentSchema);
  if (parseError) return parseError;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { marketingConsent: data.consent },
  });

  return NextResponse.json({ ok: true });
}
