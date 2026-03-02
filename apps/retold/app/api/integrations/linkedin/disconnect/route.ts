import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/route-helpers";
import { prisma } from "@/lib/prisma";
import { captureEvent } from "@/lib/posthog";

/**
 * POST /api/integrations/linkedin/disconnect
 *
 * Removes the stored LinkedIn connection for the authenticated user.
 * Idempotent — no error if there was no connection.
 */
export async function POST() {
  const { session, error } = await requireAuth();
  if (error) return error;

  await prisma.linkedInConnection.deleteMany({
    where: { userId: session.user.id },
  });

  await captureEvent(session.user.id, "linkedin_disconnected");

  return NextResponse.json({ ok: true });
}
