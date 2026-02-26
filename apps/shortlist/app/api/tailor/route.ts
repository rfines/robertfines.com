import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { tailorResume } from "@/lib/tailor-resume";
import { tailorResumeSchema } from "@/types";
import { captureEvent } from "@/lib/posthog";
import { getUserPlan } from "@/lib/get-user-plan";
import { PLAN_LIMITS, canUseInstructions, getEffectiveMonthlyLimit } from "@/lib/plan";
import { requireAuth, parseBody } from "@/lib/route-helpers";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  const { data, error: parseError } = await parseBody(req, tailorResumeSchema);
  if (parseError) return parseError;

  const plan = await getUserPlan(session.user.id);

  // Check monthly run limit
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { monthlyRunLimit: true },
  });
  const monthlyLimit = getEffectiveMonthlyLimit(plan, user?.monthlyRunLimit ?? null);
  if (monthlyLimit !== null) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const runsThisMonth = await prisma.tailoredResume.count({
      where: {
        userId: session.user.id,
        variationIndex: 0, // one record per session
        createdAt: { gte: startOfMonth },
      },
    });
    if (runsThisMonth >= monthlyLimit) {
      return NextResponse.json(
        { error: "Monthly tailoring limit reached", limit: monthlyLimit },
        { status: 403 }
      );
    }
  }

  // Gate custom instructions to paid plans
  if (data.userInstructions && !canUseInstructions(plan)) {
    return NextResponse.json(
      { error: "Custom instructions require a paid plan" },
      { status: 403 }
    );
  }

  // Cap variations to plan limit
  const maxVariations = PLAN_LIMITS[plan].variations;
  const variationCount = Math.min(data.variations, maxVariations);

  // Verify resume ownership
  const resume = await prisma.resume.findFirst({
    where: { id: data.resumeId, userId: session.user.id },
  });
  if (!resume) {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }

  const variationGroup = variationCount > 1 ? randomUUID() : null;

  const tailorInput = {
    baseResume: resume.rawText,
    jobTitle: data.jobTitle,
    company: data.company,
    jobDescription: data.jobDescription,
    intensity: data.intensity,
    userInstructions: data.userInstructions,
  };

  const results = await Promise.all(
    Array.from({ length: variationCount }, () => tailorResume(tailorInput))
  );

  const records = await prisma.tailoredResume.createManyAndReturn({
    data: results.map(({ tailoredText, tokensUsed }, i) => ({
      userId: session.user.id!,
      resumeId: resume.id,
      jobTitle: data.jobTitle,
      company: data.company ?? null,
      jobDescription: data.jobDescription,
      intensity: data.intensity,
      userInstructions: data.userInstructions ?? null,
      tailoredText,
      tokensUsed,
      variationGroup,
      variationIndex: i,
    })),
  });

  const totalTokens = results.reduce((sum, r) => sum + (r.tokensUsed ?? 0), 0);
  await captureEvent(session.user.id, "resume_tailored", {
    intensity: data.intensity,
    tokensUsed: totalTokens,
    hasCompany: !!data.company,
    variations: variationCount,
    hasInstructions: !!data.userInstructions,
  });

  return NextResponse.json(records[0], { status: 201 });
}
