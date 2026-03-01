import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  buildLinkedInAuthUrl,
  buildPersonUrn,
  exchangeLinkedInCode,
  fetchLinkedInProfile,
  createLinkedInPost,
} from "@/lib/linkedin";
import {
  LINKEDIN_OAUTH_URL,
  LINKEDIN_CONNECT_SCOPES,
} from "@/lib/constants";

// ─── Env setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.stubEnv("LINKEDIN_CLIENT_ID", "test-client-id");
  vi.stubEnv("LINKEDIN_CLIENT_SECRET", "test-client-secret");
});

// ─── buildLinkedInAuthUrl ─────────────────────────────────────────────────────

describe("buildLinkedInAuthUrl", () => {
  it("includes the base OAuth URL", () => {
    const url = buildLinkedInAuthUrl("https://example.com/callback", "state123");
    expect(url.startsWith(LINKEDIN_OAUTH_URL)).toBe(true);
  });

  it("includes response_type=code", () => {
    const url = buildLinkedInAuthUrl("https://example.com/callback", "state123");
    expect(url).toContain("response_type=code");
  });

  it("includes the client_id from env", () => {
    const url = buildLinkedInAuthUrl("https://example.com/callback", "state123");
    expect(url).toContain("client_id=test-client-id");
  });

  it("includes the redirect_uri encoded", () => {
    const url = buildLinkedInAuthUrl("https://example.com/callback", "state123");
    expect(url).toContain(encodeURIComponent("https://example.com/callback"));
  });

  it("includes the state param", () => {
    const url = buildLinkedInAuthUrl("https://example.com/callback", "mystate");
    expect(url).toContain("state=mystate");
  });

  it("includes all required scopes", () => {
    const url = buildLinkedInAuthUrl("https://example.com/callback", "state123");
    const decoded = decodeURIComponent(url);
    for (const scope of LINKEDIN_CONNECT_SCOPES.split(" ")) {
      expect(decoded).toContain(scope);
    }
  });
});

// ─── buildPersonUrn ───────────────────────────────────────────────────────────

describe("buildPersonUrn", () => {
  it("wraps a LinkedIn sub in the person URN format", () => {
    expect(buildPersonUrn("abc123")).toBe("urn:li:person:abc123");
  });

  it("handles sub values with hyphens", () => {
    expect(buildPersonUrn("a1b2-c3d4")).toBe("urn:li:person:a1b2-c3d4");
  });
});

// ─── exchangeLinkedInCode ─────────────────────────────────────────────────────

describe("exchangeLinkedInCode", () => {
  it("returns tokens on a successful response", async () => {
    const mockResponse = {
      access_token: "access-abc",
      refresh_token: "refresh-xyz",
      expires_in: 3600,
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })
    );

    const tokens = await exchangeLinkedInCode("code123", "https://example.com/callback");
    expect(tokens.accessToken).toBe("access-abc");
    expect(tokens.refreshToken).toBe("refresh-xyz");
    expect(tokens.expiresAt).toBeInstanceOf(Date);
    // expiresAt should be ~1 hour in the future
    expect(tokens.expiresAt.getTime()).toBeGreaterThan(Date.now() + 3500 * 1000);
  });

  it("throws when LinkedIn returns a non-OK response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve("invalid_grant"),
      })
    );

    await expect(
      exchangeLinkedInCode("bad-code", "https://example.com/callback")
    ).rejects.toThrow("LinkedIn token exchange failed: 400");
  });

  it("handles missing refresh_token gracefully (returns undefined)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: "at", expires_in: 3600 }),
      })
    );

    const tokens = await exchangeLinkedInCode("code", "https://example.com/callback");
    expect(tokens.refreshToken).toBeUndefined();
  });
});

// ─── fetchLinkedInProfile ─────────────────────────────────────────────────────

describe("fetchLinkedInProfile", () => {
  it("maps OIDC userinfo fields to the profile shape", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            sub: "person-sub-1",
            name: "Jane Doe",
            given_name: "Jane",
            family_name: "Doe",
            picture: "https://media.linkedin.com/pic.jpg",
            email: "jane@example.com",
          }),
      })
    );

    const profile = await fetchLinkedInProfile("access-token");
    expect(profile.sub).toBe("person-sub-1");
    expect(profile.name).toBe("Jane Doe");
    expect(profile.pictureUrl).toBe("https://media.linkedin.com/pic.jpg");
    expect(profile.email).toBe("jane@example.com");
  });

  it("constructs name from given+family when name field is absent", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            sub: "abc",
            given_name: "John",
            family_name: "Smith",
          }),
      })
    );

    const profile = await fetchLinkedInProfile("access-token");
    expect(profile.name).toBe("John Smith");
  });

  it("throws when userinfo returns non-OK", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve("Unauthorized"),
      })
    );

    await expect(fetchLinkedInProfile("bad-token")).rejects.toThrow(
      "LinkedIn userinfo failed: 401"
    );
  });
});

// ─── createLinkedInPost ───────────────────────────────────────────────────────

describe("createLinkedInPost", () => {
  it("returns the post ID from the X-RestLi-Id header", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (h: string) =>
            h.toLowerCase() === "x-restli-id" ? "urn:li:share:12345" : null,
        },
      })
    );

    const result = await createLinkedInPost(
      "access-token",
      "urn:li:person:abc",
      "Hello world"
    );
    expect(result.postId).toBe("urn:li:share:12345");
  });

  it("throws when the post API returns non-OK", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 422,
        text: () => Promise.resolve("Unprocessable Entity"),
      })
    );

    await expect(
      createLinkedInPost("token", "urn:li:person:abc", "text")
    ).rejects.toThrow("LinkedIn post creation failed: 422");
  });
});
