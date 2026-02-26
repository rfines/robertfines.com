import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tailorResume } from "@/lib/tailor-resume";
import { tailorResumeSchema } from "@/types";
import { captureEvent } from "@/lib/posthog";
import { getUserPlan } from "@/lib/get-user-plan";
import { PLAN_LIMITS, canUseInstructions } from "@/lib/plan";

export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = tailorResumeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const plan = await getUserPlan(session.user.id);

  // Gate custom instructions to paid plans
  if (parsed.data.userInstructions && !canUseInstructions(plan)) {
    return NextResponse.json(
      { error: "Custom instructions require a paid plan" },
      { status: 403 }
    );
  }

  // Cap variations to plan limit
  const maxVariations = PLAN_LIMITS[plan].variations;
  const variationCount = Math.min(parsed.data.variations, maxVariations);

  // Verify resume ownership
  const resume = await prisma.resume.findFirst({
    where: { id: parsed.data.resumeId, userId: session.user.id },
  });
  if (!resume) {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }

  const variationGroup = variationCount > 1 ? randomUUID() : null;

  const tailorInput = {
    baseResume: resume.rawText,
    jobTitle: parsed.data.jobTitle,
    company: parsed.data.company,
    jobDescription: parsed.data.jobDescription,
    intensity: parsed.data.intensity,
    userInstructions: parsed.data.userInstructions,
  };

  const results = await Promise.all(
    Array.from({ length: variationCount }, () => tailorResume(tailorInput))
  );

  const records = await prisma.tailoredResume.createManyAndReturn({
    data: results.map(({ tailoredText, tokensUsed }, i) => ({
      userId: session.user.id!,
      resumeId: resume.id,
      jobTitle: parsed.data.jobTitle,
      company: parsed.data.company ?? null,
      jobDescription: parsed.data.jobDescription,
      intensity: parsed.data.intensity,
      userInstructions: parsed.data.userInstructions ?? null,
      tailoredText,
      tokensUsed,
      variationGroup,
      variationIndex: i,
    })),
  });

  const totalTokens = results.reduce((sum, r) => sum + (r.tokensUsed ?? 0), 0);
  await captureEvent(session.user.id, "resume_tailored", {
    intensity: parsed.data.intensity,
    tokensUsed: totalTokens,
    hasCompany: !!parsed.data.company,
    variations: variationCount,
    hasInstructions: !!parsed.data.userInstructions,
  });

  return NextResponse.json(records[0], { status: 201 });
}
