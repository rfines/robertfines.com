import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/route-helpers";
import { getUserPlan } from "@/lib/get-user-plan";
import { canConnectLinkedIn } from "@/lib/plan";
import { buildLinkedInAuthUrl } from "@/lib/linkedin";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { RATE_LIMITS } from "@/lib/constants";

/**
 * GET /api/integrations/linkedin/connect
 *
 * Initiates the LinkedIn OAuth flow by redirecting the user to LinkedIn.
 * The CSRF `state` token is encoded as: `{userId}:{randomHex}` and verified
 * in the callback handler — no server-side session store needed.
 */
export async function GET(req: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const plan = await getUserPlan(session.user.id);
  if (!canConnectLinkedIn(plan)) {
    return NextResponse.json(
      { error: "LinkedIn account connection requires a Pro or Agency plan" },
      { status: 403 }
    );
  }

  const rl = await checkRateLimit(session.user.id, RATE_LIMITS.LINKEDIN_CONNECT);
  if (!rl.allowed) return rateLimitResponse(rl.resetAt);

  // Build a CSRF state: userId + random bytes.
  // The callback verifies that userId matches the authenticated session.
  const randomPart = crypto.randomUUID().replace(/-/g, "");
  const state = `${session.user.id}:${randomPart}`;

  const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/linkedin/callback`;
  const authUrl = buildLinkedInAuthUrl(redirectUri, state);

  return NextResponse.redirect(authUrl);
}
