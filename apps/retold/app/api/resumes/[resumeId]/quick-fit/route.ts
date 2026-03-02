import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-helpers";
import { extractJdSkills } from "@/lib/extract-jd-skills";
import { matchSkillsToResume } from "@/lib/keyword-match";

export const maxDuration = 30;

const BodySchema = z.object({
  jobDescription: z.string().min(50, "Job description is too short to estimate fit"),
});

interface Params {
  params: Promise<{ resumeId: string }>;
}

export async function POST(req: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  const { resumeId } = await params;
  const resume = await prisma.resume.findFirst({
    where: { id: resumeId, userId: session.user.id },
    select: { rawText: true },
  });

  if (!resume) {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }

  const skills = await extractJdSkills(parsed.data.jobDescription);
  if (skills.length === 0) {
    return NextResponse.json({ error: "Could not extract skills from job description" }, { status: 422 });
  }

  const match = matchSkillsToResume(skills, resume.rawText);

  return NextResponse.json({
    score: match.score,
    matched: match.matched,
    missing: match.missing,
    total: match.total,
  });
}
