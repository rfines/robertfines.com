import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-helpers";

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

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
