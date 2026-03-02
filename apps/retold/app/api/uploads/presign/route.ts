import { NextResponse } from "next/server";
import { createPresignedPutUrl, generateS3Key } from "@/lib/s3";
import { presignUploadSchema } from "@/types";
import { requireAuth, parseBody } from "@/lib/route-helpers";

export async function POST(req: Request) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  const { data, error: parseError } = await parseBody(req, presignUploadSchema);
  if (parseError) return parseError;

  const s3Key = generateS3Key(session.user.id, data.filename);
  const presignedUrl = await createPresignedPutUrl(s3Key, data.contentType);

  return NextResponse.json({ presignedUrl, s3Key });

}
