import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateCoverLetter } from "@/lib/generate-cover-letter";

export const maxDuration = 60;

interface Params {
  params: Promise<{ tailoredId: string }>;
}

export async function POST(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tailoredId } = await params;
  const tailored = await prisma.tailoredResume.findFirst({
    where: { id: tailoredId, userId: session.user.id },
  });

  if (!tailored) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Idempotent — return cached result if already generated
  if (tailored.coverLetterText) {
    return NextResponse.json({
      coverLetterText: tailored.coverLetterText,
      coverLetterTokensUsed: tailored.coverLetterTokensUsed,
    });
  }

  const { coverLetterText, tokensUsed } = await generateCoverLetter({
    tailoredResume: tailored.tailoredText,
    jobTitle: tailored.jobTitle,
    company: tailored.company ?? undefined,
    jobDescription: tailored.jobDescription,
  });

  const updated = await prisma.tailoredResume.update({
    where: { id: tailoredId },
    data: {
      coverLetterText,
      coverLetterTokensUsed: tokensUsed,
    },
  });

  return NextResponse.json({
    coverLetterText: updated.coverLetterText,
    coverLetterTokensUsed: updated.coverLetterTokensUsed,
  });
}
