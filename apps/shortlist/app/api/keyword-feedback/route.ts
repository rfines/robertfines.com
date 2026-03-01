import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-helpers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  const body = await req.json().catch(() => null);
  const { tailoredResumeId, term } = body ?? {};

  if (typeof tailoredResumeId !== "string" || typeof term !== "string" || !term.trim()) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Verify the tailored resume belongs to this user
  const resume = await prisma.tailoredResume.findFirst({
    where: { id: tailoredResumeId, userId: session.user.id },
    select: { id: true },
  });

  if (!resume) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Upsert — @@unique constraint handles duplicate clicks gracefully
  await prisma.termFeedback.upsert({
    where: {
      userId_tailoredResumeId_term: {
        userId: session.user.id,
        tailoredResumeId,
        term: term.trim(),
      },
    },
    create: {
      userId: session.user.id,
      tailoredResumeId,
      term: term.trim(),
    },
    update: {},
  });

  return NextResponse.json({ ok: true });
}
