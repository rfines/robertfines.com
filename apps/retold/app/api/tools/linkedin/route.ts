import { NextResponse } from "next/server";
import { anthropic } from "@/lib/anthropic";
import { requireAuth } from "@/lib/route-helpers";
import { getUserPlan } from "@/lib/get-user-plan";
import { canUseLinkedInOptimizer } from "@/lib/plan";
import { captureEvent } from "@/lib/posthog";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  // 10 generations per hour per user
  const rl = await checkRateLimit(session.user.id, {
    action: "linkedin-optimizer",
    limit: 10,
    windowSecs: 3600,
  });
  if (!rl.allowed) return rateLimitResponse(rl.resetAt);

  const plan = await getUserPlan(session.user.id);
  if (!canUseLinkedInOptimizer(plan)) {
    return NextResponse.json(
      { error: "LinkedIn Optimizer requires a Pro or Agency plan" },
      { status: 403 }
    );
  }

  let resumeText: string;
  let jobTitle: string | undefined;
  try {
    const body = await req.json();
    resumeText = body?.resumeText;
    jobTitle = body?.jobTitle;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!resumeText || typeof resumeText !== "string" || !resumeText.trim()) {
    return NextResponse.json({ error: "resumeText is required" }, { status: 400 });
  }

  const userPrompt = jobTitle?.trim()
    ? `Target job title: ${jobTitle.trim()}\n\nResume:\n${resumeText.trim()}`
    : `Resume:\n${resumeText.trim()}`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system:
      'You are a LinkedIn profile expert. Based on the resume below, write: 1) A LinkedIn headline of max 220 characters that positions this person for the target role. 2) A LinkedIn About section of max 2600 characters that tells their professional story. Return ONLY valid JSON: { "headline": "...", "summary": "..." }',
    messages: [{ role: "user", content: userPrompt }],
  });

  const raw = message.content[0]?.type === "text" ? message.content[0].text : "";

  let headline: string;
  let summary: string;
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    headline = parsed.headline;
    summary = parsed.summary;
    if (!headline || !summary) throw new Error("Missing fields");
  } catch {
    return NextResponse.json(
      { error: "Could not parse response from Claude" },
      { status: 500 }
    );
  }

  await captureEvent(session.user.id, "linkedin_optimized");

  return NextResponse.json({ headline, summary });
}
