import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { error } = await assertAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const take = 50;
  const skip = (page - 1) * take;

  const where = q
    ? {
        OR: [
          { email: { contains: q, mode: "insensitive" as const } },
          { name: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        role: true,
        createdAt: true,
        _count: { select: { resumes: true, tailoredResumes: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({ users, total, page });
}
