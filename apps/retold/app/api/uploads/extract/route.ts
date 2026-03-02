import { NextResponse } from "next/server";
import { getObjectBuffer } from "@/lib/s3";
import { extractText } from "@/lib/extract-text";
import { extractResumeSchema } from "@/types";
import { requireAuth, parseBody } from "@/lib/route-helpers";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(req: Request) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  const { data, error: parseError } = await parseBody(req, extractResumeSchema);
  if (parseError) return parseError;

  // Verify the S3 key belongs to this user
  const expectedPrefix = `resumes/${session.user.id}/`;
  if (!data.s3Key.startsWith(expectedPrefix)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const buffer = await getObjectBuffer(data.s3Key);
  if (buffer.length > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 413 });
  }

  const text = await extractText(buffer, data.fileType);

  return NextResponse.json({ text });
}
