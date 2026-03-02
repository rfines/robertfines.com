import { NextResponse } from "next/server";
import { anthropic } from "@/lib/anthropic";
import { requireAuth } from "@/lib/route-helpers";
import { getUserPlan } from "@/lib/get-user-plan";
import { canUseBulletRewriter } from "@/lib/plan";
import { captureEvent } from "@/lib/posthog";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  // 20 rewrites per hour per user
  const rl = await checkRateLimit(session.user.id, {
    action: "bullet-rewriter",
    limit: 20,
    windowSecs: 3600,
  });
  if (!rl.allowed) return rateLimitResponse(rl.resetAt);

  const plan = await getUserPlan(session.user.id);
  if (!canUseBulletRewriter(plan)) {
    return NextResponse.json(
      { error: "Bullet Rewriter requires a paid plan" },
      { status: 403 }
    );
  }

  let bullet: string;
  try {
    const body = await req.json();
    bullet = body?.bullet;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!bullet || typeof bullet !== "string" || !bullet.trim()) {
    return NextResponse.json({ error: "bullet is required" }, { status: 400 });
  }

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 600,
    system:
      "You are an expert resume writer. Rewrite the following resume bullet point in three distinct ways — each stronger, more specific, and more impact-focused. Use action verbs and quantify where the original implies numbers. Return ONLY a valid JSON array of exactly 3 strings.",
    messages: [{ role: "user", content: bullet.trim() }],
  });

  const raw = message.content[0]?.type === "text" ? message.content[0].text : "";

  let rewrites: string[];
  try {
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    rewrites = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    if (!Array.isArray(rewrites) || rewrites.length !== 3) {
      throw new Error("Unexpected response shape");
    }
  } catch {
    return NextResponse.json({ error: "Could not parse rewrites from Claude" }, { status: 500 });
  }

  await captureEvent(session.user.id, "bullet_rewritten");

  return NextResponse.json({ rewrites });
}
