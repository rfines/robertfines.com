import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tailorResume } from "@/lib/tailor-resume";
import { tailorResumeSchema } from "@/types";

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

  // Verify resume ownership
  const resume = await prisma.resume.findFirst({
    where: { id: parsed.data.resumeId, userId: session.user.id },
  });
  if (!resume) {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }

  const { tailoredText, tokensUsed } = await tailorResume({
    baseResume: resume.rawText,
    jobTitle: parsed.data.jobTitle,
    company: parsed.data.company,
    jobDescription: parsed.data.jobDescription,
  });

  const tailoredResume = await prisma.tailoredResume.create({
    data: {
      userId: session.user.id,
      resumeId: resume.id,
      jobTitle: parsed.data.jobTitle,
      company: parsed.data.company ?? null,
      jobDescription: parsed.data.jobDescription,
      tailoredText,
      tokensUsed,
    },
  });

  return NextResponse.json(tailoredResume, { status: 201 });
}
