import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createResumeSchema } from "@/types";
import { captureEvent } from "@/lib/posthog";
import { requireAuth, parseBody } from "@/lib/route-helpers";

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const resumes = await prisma.resume.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      fileType: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(resumes);
}

export async function POST(req: Request) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  const { data, error: parseError } = await parseBody(req, createResumeSchema);
  if (parseError) return parseError;

  const resume = await prisma.resume.create({
    data: {
      userId: session.user.id,
      title: data.title,
      rawText: data.rawText,
    },
  });

  await captureEvent(session.user.id, "resume_created");

  return NextResponse.json(resume, { status: 201 });
}
