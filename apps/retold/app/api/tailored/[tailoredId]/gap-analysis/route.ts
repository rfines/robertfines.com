import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateGapAnalysis } from "@/lib/generate-gap-analysis";
import { captureEvent } from "@/lib/posthog";
import { requireAuth } from "@/lib/route-helpers";
import { getUserPlan } from "@/lib/get-user-plan";
import { canViewGapAnalysis } from "@/lib/plan";

export const maxDuration = 30;

interface Params {
  params: Promise<{ tailoredId: string }>;
}

export async function POST(_req: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const plan = await getUserPlan(session.user.id);
  if (!canViewGapAnalysis(plan)) {
    return NextResponse.json(
      { error: "Gap analysis requires a paid plan" },
      { status: 403 }
    );
  }

  const { tailoredId } = await params;
  const tailored = await prisma.tailoredResume.findFirst({
    where: { id: tailoredId, userId: session.user.id },
    include: { resume: { select: { rawText: true } } },
  });

  if (!tailored) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Idempotent — return cached result if already generated
  if (tailored.gapAnalysis) {
    try {
      const cached = JSON.parse(tailored.gapAnalysis);
      return NextResponse.json({ gapAnalysis: cached });
    } catch {
      // Corrupted cache — regenerate below
    }
  }

  const result = await generateGapAnalysis({
    resumeText: tailored.resume.rawText,
    tailoredText: tailored.tailoredText,
    jobTitle: tailored.jobTitle,
    company: tailored.company ?? undefined,
    jobDescription: tailored.jobDescription,
  });

  const { tokensUsed, ...analysisToStore } = result;

  await prisma.tailoredResume.update({
    where: { id: tailoredId },
    data: { gapAnalysis: JSON.stringify(analysisToStore) },
  });

  await captureEvent(session.user.id, "gap_analysis_generated", {
    tailoredResumeId: tailoredId,
    gapCount: result.gaps.length,
    skillsToAddCount: result.skillsToAdd.length,
    tokensUsed,
  });

  return NextResponse.json({ gapAnalysis: analysisToStore });
}
