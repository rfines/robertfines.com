import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, parseBody } from "@/lib/route-helpers";
import { getUserPlan } from "@/lib/get-user-plan";
import { canConnectLinkedIn } from "@/lib/plan";
import { createLinkedInPost, buildPersonUrn } from "@/lib/linkedin";
import { prisma } from "@/lib/prisma";
import { captureEvent } from "@/lib/posthog";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { RATE_LIMITS } from "@/lib/constants";

const publishSchema = z.object({
  /**
   * "headline" or "about" — drives the post template text.
   * The actual content to publish is in `text`.
   */
  type: z.enum(["headline", "about"]),
  text: z.string().min(1).max(3000),
});

/**
 * POST /api/integrations/linkedin/publish
 *
 * Creates a UGC post on the member's LinkedIn feed with the AI-generated
 * headline or About section as the body text.
 *
 * Note: LinkedIn's standard API (w_member_social scope) creates feed posts,
 * not direct profile field updates (which require the restricted rw_vin scope
 * via LinkedIn's Partner Program). A post lets the member share their new
 * content with their network immediately.
 */
export async function POST(req: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const plan = await getUserPlan(session.user.id);
  if (!canConnectLinkedIn(plan)) {
    return NextResponse.json(
      { error: "LinkedIn publishing requires a Pro or Agency plan" },
      { status: 403 }
    );
  }

  const rl = await checkRateLimit(session.user.id, RATE_LIMITS.LINKEDIN_PUBLISH);
  if (!rl.allowed) return rateLimitResponse(rl.resetAt);

  const { data, error: bodyError } = await parseBody(req, publishSchema);
  if (bodyError) return bodyError;

  const connection = await prisma.linkedInConnection.findUnique({
    where: { userId: session.user.id },
    select: { accessToken: true, linkedInId: true },
  });

  if (!connection) {
    return NextResponse.json(
      { error: "No LinkedIn account connected" },
      { status: 400 }
    );
  }

  const personUrn = buildPersonUrn(connection.linkedInId);

  // Wrap in a template that adds context for the member's network
  const postText =
    data.type === "headline"
      ? `My updated LinkedIn headline, crafted with AI:\n\n${data.text}`
      : `My updated LinkedIn About section, crafted with AI:\n\n${data.text}`;

  try {
    await createLinkedInPost(connection.accessToken, personUrn, postText);
  } catch {
    return NextResponse.json(
      { error: "Could not post to LinkedIn. Your connection may have expired — try reconnecting." },
      { status: 502 }
    );
  }

  await captureEvent(session.user.id, "linkedin_published", { type: data.type });

  return NextResponse.json({ ok: true });
}
