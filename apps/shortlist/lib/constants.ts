// ─── LinkedIn OAuth & API ────────────────────────────────────────────────────

export const LINKEDIN_OAUTH_URL =
  "https://www.linkedin.com/oauth/v2/authorization";
export const LINKEDIN_TOKEN_URL =
  "https://www.linkedin.com/oauth/v2/accessToken";
export const LINKEDIN_USERINFO_URL = "https://api.linkedin.com/v2/userinfo";
export const LINKEDIN_UGC_POSTS_URL = "https://api.linkedin.com/v2/ugcPosts";

/**
 * Scopes requested during LinkedIn account connection.
 * - openid / profile / email: OIDC — gives name, picture, email, sub (person URN)
 *
 * Note: w_member_social (feed posting) is intentionally excluded until direct
 * profile-field updates are available via LinkedIn's Partner Program. At that
 * point, add "w_member_social" here and prompt existing users to reconnect.
 */
export const LINKEDIN_CONNECT_SCOPES = "openid profile email";

/** Days after which an imported LinkedIn profile is considered stale */
export const LINKEDIN_STALENESS_DAYS = 30;

// ─── Rate Limits ─────────────────────────────────────────────────────────────

export const RATE_LIMITS = {
  LINKEDIN_CONNECT: { action: "linkedin-connect", limit: 5, windowSecs: 3600 },
  LINKEDIN_PUBLISH: { action: "linkedin-publish", limit: 10, windowSecs: 3600 },
  LINKEDIN_IMPORT: { action: "linkedin-import", limit: 10, windowSecs: 3600 },
} as const;
