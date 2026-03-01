/**
 * LinkedIn API helpers.
 *
 * All external LinkedIn API calls are centralised here so that the rest of
 * the app never needs to know the shape of LinkedIn's responses.
 *
 * Tokens are handled server-side only — the client never sees them.
 */

import {
  LINKEDIN_TOKEN_URL,
  LINKEDIN_USERINFO_URL,
  LINKEDIN_UGC_POSTS_URL,
  LINKEDIN_OAUTH_URL,
  LINKEDIN_CONNECT_SCOPES,
} from "./constants";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LinkedInProfile {
  /** LinkedIn person sub (used as author URN: urn:li:person:{sub}) */
  sub: string;
  name: string;
  givenName?: string;
  familyName?: string;
  pictureUrl?: string;
  email?: string;
  /** LinkedIn headline, present if the account grants r_liteprofile / profile */
  headline?: string;
}

export interface LinkedInTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
}

// ─── OAuth helpers ────────────────────────────────────────────────────────────

/**
 * Build the LinkedIn authorization URL.
 * `state` must be a CSRF-safe random value stored in the user session.
 */
export function buildLinkedInAuthUrl(
  redirectUri: string,
  state: string
): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.LINKEDIN_CLIENT_ID!,
    redirect_uri: redirectUri,
    scope: LINKEDIN_CONNECT_SCOPES,
    state,
  });
  return `${LINKEDIN_OAUTH_URL}?${params.toString()}`;
}

/**
 * Exchange an authorization code for access + refresh tokens.
 * Throws on network error or LinkedIn error response.
 */
export async function exchangeLinkedInCode(
  code: string,
  redirectUri: string
): Promise<LinkedInTokens> {
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: process.env.LINKEDIN_CLIENT_ID!,
    client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
  });

  const res = await fetch(LINKEDIN_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "(no body)");
    throw new Error(`LinkedIn token exchange failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  const expiresInSecs: number = data.expires_in ?? 3600;
  const expiresAt = new Date(Date.now() + expiresInSecs * 1000);

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? undefined,
    expiresAt,
  };
}

// ─── Profile ─────────────────────────────────────────────────────────────────

/**
 * Fetch the authenticated member's profile via the OIDC /v2/userinfo endpoint.
 * Returns minimal data — only what LinkedIn exposes under openid+profile+email.
 */
export async function fetchLinkedInProfile(
  accessToken: string
): Promise<LinkedInProfile> {
  const res = await fetch(LINKEDIN_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "(no body)");
    throw new Error(`LinkedIn userinfo failed: ${res.status} ${text}`);
  }

  const data = await res.json();

  return {
    sub: data.sub,
    name: data.name ?? [data.given_name, data.family_name].filter(Boolean).join(" "),
    givenName: data.given_name,
    familyName: data.family_name,
    pictureUrl: data.picture,
    email: data.email,
  };
}

// ─── Posting ──────────────────────────────────────────────────────────────────

/**
 * Create a UGC post on the member's LinkedIn feed.
 * Requires w_member_social scope.
 *
 * `personUrn` format: "urn:li:person:{sub}"
 */
export async function createLinkedInPost(
  accessToken: string,
  personUrn: string,
  text: string
): Promise<{ postId: string }> {
  const body = {
    author: personUrn,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text },
        shareMediaCategory: "NONE",
      },
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
    },
  };

  const res = await fetch(LINKEDIN_UGC_POSTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "(no body)");
    throw new Error(`LinkedIn post creation failed: ${res.status} ${text}`);
  }

  // LinkedIn returns the post URN in the X-RestLi-Id header
  const postId = res.headers.get("x-restli-id") ?? res.headers.get("X-RestLi-Id") ?? "";
  return { postId };
}

// ─── Person URN ──────────────────────────────────────────────────────────────

/** Build the LinkedIn person URN from an OIDC sub value */
export function buildPersonUrn(sub: string): string {
  return `urn:li:person:${sub}`;
}
