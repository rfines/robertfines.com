import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateResumeSchema } from "@/types";

interface Params {
  params: Promise<{ resumeId: string }>;
}

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { resumeId } = await params;
  const resume = await prisma.resume.findFirst({
    where: { id: resumeId, userId: session.user.id },
  });

  if (!resume) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(resume);
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { resumeId } = await params;
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateResumeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const resume = await prisma.resume.updateMany({
    where: { id: resumeId, userId: session.user.id },
    data: parsed.data,
  });

  if (resume.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.resume.findUnique({ where: { id: resumeId } });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { resumeId } = await params;
  const deleted = await prisma.resume.deleteMany({
    where: { id: resumeId, userId: session.user.id },
  });

  if (deleted.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
