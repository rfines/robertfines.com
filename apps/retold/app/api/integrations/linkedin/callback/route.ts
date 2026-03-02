import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/route-helpers";
import { exchangeLinkedInCode, fetchLinkedInProfile } from "@/lib/linkedin";
import { prisma } from "@/lib/prisma";
import { captureEvent } from "@/lib/posthog";

/**
 * GET /api/integrations/linkedin/callback?code=...&state=...
 *
 * Handles the LinkedIn OAuth callback.
 * Verifies the state param, exchanges the code for tokens, fetches the
 * LinkedIn profile, and upserts a LinkedInConnection record.
 *
 * On success, redirects to /dashboard/tools/linkedin?connected=true
 * On failure, redirects to /dashboard/tools/linkedin?error=linkedin_connect
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const linkedInError = searchParams.get("error");

  const errorRedirect = `${process.env.NEXTAUTH_URL}/dashboard/tools/linkedin?error=linkedin_connect`;
  const successRedirect = `${process.env.NEXTAUTH_URL}/dashboard/tools/linkedin?connected=true`;

  // User denied the OAuth permission grant
  if (linkedInError) {
    return NextResponse.redirect(errorRedirect);
  }

  if (!code || !state) {
    return NextResponse.redirect(errorRedirect);
  }

  // Verify state: format is "{userId}:{randomHex}"
  const { session, error: authError } = await requireAuth();
  if (authError) return NextResponse.redirect(errorRedirect);

  const [stateUserId] = state.split(":");
  if (stateUserId !== session.user.id) {
    return NextResponse.redirect(errorRedirect);
  }

  try {
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/linkedin/callback`;
    const tokens = await exchangeLinkedInCode(code, redirectUri);
    const profile = await fetchLinkedInProfile(tokens.accessToken);

    await prisma.linkedInConnection.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        linkedInId: profile.sub,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken ?? null,
        expiresAt: tokens.expiresAt,
        cachedName: profile.name,
        cachedHeadline: profile.headline ?? null,
        cachedPictureUrl: profile.pictureUrl ?? null,
      },
      update: {
        linkedInId: profile.sub,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken ?? null,
        expiresAt: tokens.expiresAt,
        cachedName: profile.name,
        cachedHeadline: profile.headline ?? null,
        cachedPictureUrl: profile.pictureUrl ?? null,
      },
    });

    await captureEvent(session.user.id, "linkedin_connected");

    return NextResponse.redirect(successRedirect);
  } catch {
    return NextResponse.redirect(errorRedirect);
  }
}
