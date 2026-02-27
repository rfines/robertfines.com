import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateCoverLetter } from "@/lib/generate-cover-letter";
import { captureEvent } from "@/lib/posthog";
import { requireAuth } from "@/lib/route-helpers";
import { getUserPlan } from "@/lib/get-user-plan";
import { canGenerateCoverLetter } from "@/lib/plan";

export const maxDuration = 60;

interface Params {
  params: Promise<{ tailoredId: string }>;
}

export async function POST(_req: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const plan = await getUserPlan(session.user.id);
  if (!canGenerateCoverLetter(plan)) {
    return NextResponse.json(
      { error: "Cover letter generation requires a paid plan" },
      { status: 403 }
    );
  }

  const { tailoredId } = await params;
  const tailored = await prisma.tailoredResume.findFirst({
    where: { id: tailoredId, userId: session.user.id },
  });

  if (!tailored) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Idempotent — return cached result if already generated
  if (tailored.coverLetterText) {
    return NextResponse.json({
      coverLetterText: tailored.coverLetterText,
      coverLetterTokensUsed: tailored.coverLetterTokensUsed,
    });
  }

  const { coverLetterText, tokensUsed } = await generateCoverLetter({
    tailoredResume: tailored.tailoredText,
    jobTitle: tailored.jobTitle,
    company: tailored.company ?? undefined,
    jobDescription: tailored.jobDescription,
  });

  const updated = await prisma.tailoredResume.update({
    where: { id: tailoredId },
    data: {
      coverLetterText,
      coverLetterTokensUsed: tokensUsed,
    },
  });

  await captureEvent(session.user.id, "cover_letter_generated", { tokensUsed });

  return NextResponse.json({
    coverLetterText: updated.coverLetterText,
    coverLetterTokensUsed: updated.coverLetterTokensUsed,
  });
}
