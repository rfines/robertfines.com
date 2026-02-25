import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createPresignedPutUrl, generateS3Key } from "@/lib/s3";
import { presignUploadSchema } from "@/types";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = presignUploadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const s3Key = generateS3Key(session.user.id, parsed.data.filename);
  const presignedUrl = await createPresignedPutUrl(s3Key, parsed.data.contentType);

  return NextResponse.json({ presignedUrl, s3Key });
}
