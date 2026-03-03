import { NextResponse } from "next/server";
import { requireAuth, parseBody } from "@/lib/route-helpers";
import { getUserPlan } from "@/lib/get-user-plan";
import { canSendFeedback } from "@/lib/plan";
import { captureEvent } from "@/lib/posthog";
import { feedbackSchema } from "@/types";

export async function POST(req: Request) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  const plan = await getUserPlan(session.user.id);
  if (!canSendFeedback(plan)) {
    return NextResponse.json(
      { error: "Feedback requires a paid plan" },
      { status: 403 }
    );
  }

  const { data, error: parseError } = await parseBody(req, feedbackSchema);
  if (parseError) return parseError;

  await captureEvent(session.user.id, "feedback_submitted", {
    category: data.category,
    details: data.details,
    page_path: data.pagePath,
    plan,
  });

  return NextResponse.json({ ok: true });
}
