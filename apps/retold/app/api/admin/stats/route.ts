import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await assertAdmin();
  if (error) return error;

  const [totalUsers, planDistribution, totalResumes, totalTailored, recentSignups] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.groupBy({ by: ["plan"], _count: { plan: true } }),
      prisma.resume.count(),
      prisma.tailoredResume.count(),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, email: true, name: true, plan: true, createdAt: true },
      }),
    ]);

  return NextResponse.json({
    totalUsers,
    totalResumes,
    totalTailored,
    planDistribution: Object.fromEntries(
      planDistribution.map((r) => [r.plan, r._count.plan])
    ),
    recentSignups,
  });
}
