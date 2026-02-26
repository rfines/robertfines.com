import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getObjectBuffer } from "@/lib/s3";
import { extractText } from "@/lib/extract-text";
import { uploadResumeFileSchema } from "@/types";
import { captureEvent } from "@/lib/posthog";
import { requireAuth, parseBody } from "@/lib/route-helpers";

interface Params {
  params: Promise<{ resumeId: string }>;
}

export async function POST(req: Request, { params }: Params) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  const { resumeId } = await params;

  // Verify ownership
  const resume = await prisma.resume.findFirst({
    where: { id: resumeId, userId: session.user.id },
  });
  if (!resume) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data, error: parseError } = await parseBody(req, uploadResumeFileSchema);
  if (parseError) return parseError;

  const buffer = await getObjectBuffer(data.s3Key);
  const rawText = await extractText(buffer, data.fileType);

  const updated = await prisma.resume.update({
    where: { id: resumeId },
    data: {
      rawText,
      s3Key: data.s3Key,
      fileType: data.fileType,
    },
  });

  await captureEvent(session.user.id, "resume_uploaded");

  return NextResponse.json(updated);
}
