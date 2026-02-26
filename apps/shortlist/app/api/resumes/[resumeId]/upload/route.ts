import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getObjectBuffer } from "@/lib/s3";
import { extractText } from "@/lib/extract-text";
import { uploadResumeFileSchema } from "@/types";
import { captureEvent } from "@/lib/posthog";

interface Params {
  params: Promise<{ resumeId: string }>;
}

export async function POST(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { resumeId } = await params;

  // Verify ownership
  const resume = await prisma.resume.findFirst({
    where: { id: resumeId, userId: session.user.id },
  });
  if (!resume) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = uploadResumeFileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const buffer = await getObjectBuffer(parsed.data.s3Key);
  const rawText = await extractText(buffer, parsed.data.fileType);

  const updated = await prisma.resume.update({
    where: { id: resumeId },
    data: {
      rawText,
      s3Key: parsed.data.s3Key,
      fileType: parsed.data.fileType,
    },
  });

  await captureEvent(session.user.id, "resume_uploaded");

  return NextResponse.json(updated);
}
