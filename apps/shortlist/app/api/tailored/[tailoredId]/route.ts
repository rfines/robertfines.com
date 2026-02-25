import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    include: { resume: { select: { title: true } } },
  });

  if (!tailoredResume) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(tailoredResume);
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tailoredId } = await params;
  const deleted = await prisma.tailoredResume.deleteMany({
    where: { id: tailoredId, userId: session.user.id },
  });

  if (deleted.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
