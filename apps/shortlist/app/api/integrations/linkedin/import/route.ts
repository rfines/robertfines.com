import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/route-helpers";
import { getUserPlan } from "@/lib/get-user-plan";
import { canConnectLinkedIn } from "@/lib/plan";
import { fetchLinkedInProfile } from "@/lib/linkedin";
import { prisma } from "@/lib/prisma";
import { captureEvent } from "@/lib/posthog";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { RATE_LIMITS } from "@/lib/constants";

/**
 * POST /api/integrations/linkedin/import
 *
 * Fetches the user's current LinkedIn profile (name, headline) and creates
 * a new Resume record pre-populated with that data.
 *
 * This gives users a "resume seed" they can then tailor for specific roles.
 * Returns { resumeId } so the client can redirect to the resume page.
 */
export async function POST() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const plan = await getUserPlan(session.user.id);
  if (!canConnectLinkedIn(plan)) {
    return NextResponse.json(
      { error: "LinkedIn import requires a Pro or Agency plan" },
      { status: 403 }
    );
  }

  const rl = await checkRateLimit(session.user.id, RATE_LIMITS.LINKEDIN_IMPORT);
  if (!rl.allowed) return rateLimitResponse(rl.resetAt);

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

  let profile;
  try {
    profile = await fetchLinkedInProfile(connection.accessToken);
  } catch {
    return NextResponse.json(
      { error: "Could not fetch LinkedIn profile. Your connection may have expired — try reconnecting." },
      { status: 502 }
    );
  }

  // Build the initial resume text from available profile data.
  // This is intentionally minimal — LinkedIn's standard OAuth does not expose
  // full profile sections (experience, education). Users flesh it out manually.
  const lines: string[] = [];
  if (profile.name) lines.push(profile.name);
  if (profile.headline) lines.push(profile.headline);
  if (profile.email) lines.push(profile.email);
  lines.push(""); // blank line separator
  lines.push("[ Import your experience, education, and skills from LinkedIn or paste them here. ]");

  const rawText = lines.join("\n");
  const today = new Date().toISOString().slice(0, 10);
  const title = `${profile.name ?? "LinkedIn"} — Imported ${today}`;

  const resume = await prisma.resume.create({
    data: {
      userId: session.user.id,
      title,
      rawText,
    },
  });

  // Update the cached profile and lastImportedAt
  await prisma.linkedInConnection.update({
    where: { userId: session.user.id },
    data: {
      cachedName: profile.name,
      cachedHeadline: profile.headline ?? null,
      cachedPictureUrl: profile.pictureUrl ?? null,
      lastImportedAt: new Date(),
    },
  });

  await captureEvent(session.user.id, "linkedin_profile_imported");

  return NextResponse.json({ resumeId: resume.id });
}
