import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getObjectBuffer } from "@/lib/s3";
import { extractText } from "@/lib/extract-text";
import { z } from "zod";

const schema = z.object({
  s3Key: z.string().min(1),
  fileType: z.enum(["pdf", "docx"]),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Verify the S3 key belongs to this user
  const expectedPrefix = `resumes/${session.user.id}/`;
  if (!parsed.data.s3Key.startsWith(expectedPrefix)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const buffer = await getObjectBuffer(parsed.data.s3Key);
  const text = await extractText(buffer, parsed.data.fileType);

  return NextResponse.json({ text });
}
