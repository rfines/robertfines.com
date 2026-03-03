import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { waitlistSchema } from "@/types";
import { captureEvent } from "@/lib/posthog";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = waitlistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { email, name, source } = parsed.data;

  const entry = await prisma.waitlistEntry.upsert({
    where: { email: email.toLowerCase() },
    create: {
      email: email.toLowerCase(),
      name: name?.trim() || null,
      source: source?.trim() || null,
    },
    update: {},
  });

  captureEvent(entry.id, "waitlist_signup", {
    email: entry.email,
    source: entry.source ?? "direct",
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
