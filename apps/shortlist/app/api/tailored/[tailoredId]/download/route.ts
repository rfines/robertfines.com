import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateDocx } from "@/lib/generate-docx";
import { NextResponse } from "next/server";

interface Params {
  params: Promise<{ tailoredId: string }>;
}

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tailoredId } = await params;
  const tailoredResume = await prisma.tailoredResume.findFirst({
    where: { id: tailoredId, userId: session.user.id },
  });

  if (!tailoredResume) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const docxBuffer = await generateDocx(
    tailoredResume.tailoredText,
    tailoredResume.jobTitle,
    tailoredResume.company
  );

  const slug = [tailoredResume.jobTitle, tailoredResume.company]
    .filter(Boolean)
    .join("_")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 80);

  return new Response(new Uint8Array(docxBuffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${slug}_Resume.docx"`,
    },
  });
}
