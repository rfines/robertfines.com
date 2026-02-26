import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { tailorResume } from "@/lib/tailor-resume";
import { captureEvent } from "@/lib/posthog";
import type { Intensity } from "@/types";

interface Params {
  params: Promise<{ userId: string; tailoredId: string }>;
}

export const maxDuration = 60;

export async function POST(_req: Request, { params }: Params) {
  const { session, error } = await assertAdmin();
  if (error) return error;

  const { userId, tailoredId } = await params;

  const tailored = await prisma.tailoredResume.findFirst({
    where: { id: tailoredId, userId },
    include: { resume: { select: { rawText: true } } },
  });

  if (!tailored) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { tailoredText, tokensUsed } = await tailorResume({
    baseResume: tailored.resume.rawText,
    jobTitle: tailored.jobTitle,
    company: tailored.company ?? undefined,
    jobDescription: tailored.jobDescription,
    intensity: (tailored.intensity as Intensity) ?? "moderate",
    userInstructions: tailored.userInstructions ?? undefined,
  });

  const updated = await prisma.tailoredResume.update({
    where: { id: tailoredId },
    data: { tailoredText, tokensUsed },
  });

  await captureEvent(session.user.id, "admin_reprocess", {
    tailoredId,
    targetUserId: userId,
    tokensUsed,
  });

  return NextResponse.json(updated);
}
