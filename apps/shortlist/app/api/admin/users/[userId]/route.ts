import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { captureEvent } from "@/lib/posthog";
import { adminUserPatchSchema } from "@/types";

interface Params {
  params: Promise<{ userId: string }>;
}

export async function GET(_req: Request, { params }: Params) {
  const { error } = await assertAdmin();
  if (error) return error;

  const { userId } = await params;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      resumes: { orderBy: { updatedAt: "desc" } },
      tailoredResumes: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(req: Request, { params }: Params) {
  const { session, error } = await assertAdmin();
  if (error) return error;

  const { userId } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const parsed = adminUserPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.user.update({
    where: { id: userId },
    data: parsed.data,
    select: { id: true, email: true, plan: true, role: true },
  });

  await captureEvent(session.user.id, "admin_user_updated", {
    targetUserId: userId,
    changes: parsed.data,
  });

  return NextResponse.json(updated);
}
