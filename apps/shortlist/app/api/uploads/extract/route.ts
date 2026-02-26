import { NextResponse } from "next/server";
import { getObjectBuffer } from "@/lib/s3";
import { extractText } from "@/lib/extract-text";
import { extractResumeSchema } from "@/types";
import { requireAuth, parseBody } from "@/lib/route-helpers";

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
  const text = await extractText(buffer, data.fileType);

  return NextResponse.json({ text });
}
