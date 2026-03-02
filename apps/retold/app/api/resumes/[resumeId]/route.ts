import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateResumeSchema } from "@/types";
import { requireAuth, parseBody } from "@/lib/route-helpers";

interface Params {
  params: Promise<{ resumeId: string }>;
}

export async function GET(_req: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

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
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  const { resumeId } = await params;

  const { data, error: parseError } = await parseBody(req, updateResumeSchema);
  if (parseError) return parseError;

  const resume = await prisma.resume.updateMany({
    where: { id: resumeId, userId: session.user.id },
    data,
  });

  if (resume.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.resume.findUnique({ where: { id: resumeId } });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { resumeId } = await params;
  const deleted = await prisma.resume.deleteMany({
    where: { id: resumeId, userId: session.user.id },
  });

  if (deleted.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
