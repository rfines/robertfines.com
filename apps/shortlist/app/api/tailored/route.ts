import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tailoredResumes = await prisma.tailoredResume.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      jobTitle: true,
      company: true,
      createdAt: true,
      resume: { select: { title: true } },
    },
  });

  return NextResponse.json(tailoredResumes);
}
