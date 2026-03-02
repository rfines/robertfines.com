import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    linkedInConnection: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    resume: {
      create: vi.fn(),
    },
  },
}));
vi.mock("@/lib/get-user-plan", () => ({ getUserPlan: vi.fn().mockResolvedValue("pro") }));
vi.mock("@/lib/posthog", () => ({ captureEvent: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 9, resetAt: 9999999999 }),
  rateLimitResponse: vi.fn(),
}));
vi.mock("@/lib/linkedin", () => ({
  buildLinkedInAuthUrl: vi.fn().mockReturnValue("https://linkedin.com/oauth/fake"),
  exchangeLinkedInCode: vi.fn(),
  fetchLinkedInProfile: vi.fn(),
  createLinkedInPost: vi.fn(),
  buildPersonUrn: vi.fn((sub: string) => `urn:li:person:${sub}`),
}));

import { GET as connectRoute } from "@/app/api/integrations/linkedin/connect/route";
import { POST as disconnectRoute } from "@/app/api/integrations/linkedin/disconnect/route";
import { POST as importRoute } from "@/app/api/integrations/linkedin/import/route";
import { POST as publishRoute } from "@/app/api/integrations/linkedin/publish/route";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserPlan } from "@/lib/get-user-plan";
import {
  exchangeLinkedInCode,
  fetchLinkedInProfile,
  createLinkedInPost,
} from "@/lib/linkedin";

const SESSION = {
  user: { id: "user_pro", email: "pro@example.com" },
  expires: "2099-01-01",
};

const CONNECTION = {
  linkedInId: "li_sub_123",
  accessToken: "li_access_token",
  refreshToken: "li_refresh",
  expiresAt: new Date(Date.now() + 3600 * 1000),
  cachedName: "Jane Doe",
  cachedHeadline: "Senior Engineer",
  cachedPictureUrl: null,
  lastImportedAt: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXTAUTH_URL", "https://retold.dev");
  vi.stubEnv("LINKEDIN_CLIENT_ID", "test-client-id");
  vi.mocked(auth).mockResolvedValue(SESSION as never);
  vi.mocked(getUserPlan).mockResolvedValue("pro");
});

// ─── /connect ─────────────────────────────────────────────────────────────────

describe("GET /api/integrations/linkedin/connect", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const req = new Request("https://retold.dev/api/integrations/linkedin/connect");
    const res = await connectRoute(req);
    expect(res.status).toBe(401);
  });

  it("returns 403 when user is on a free plan", async () => {
    vi.mocked(getUserPlan).mockResolvedValue("free");
    const req = new Request("https://retold.dev/api/integrations/linkedin/connect");
    const res = await connectRoute(req);
    expect(res.status).toBe(403);
  });

  it("redirects to LinkedIn OAuth URL for a Pro user", async () => {
    const req = new Request("https://retold.dev/api/integrations/linkedin/connect");
    const res = await connectRoute(req);
    // Should be a redirect (3xx)
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
    const location = res.headers.get("location");
    expect(location).toBe("https://linkedin.com/oauth/fake");
  });
});

// ─── /disconnect ──────────────────────────────────────────────────────────────

describe("POST /api/integrations/linkedin/disconnect", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const res = await disconnectRoute();
    expect(res.status).toBe(401);
  });

  it("deletes the connection and returns ok", async () => {
    vi.mocked(prisma.linkedInConnection.deleteMany).mockResolvedValue({ count: 1 } as never);
    const res = await disconnectRoute();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(prisma.linkedInConnection.deleteMany).toHaveBeenCalledWith({
      where: { userId: SESSION.user.id },
    });
  });

  it("is idempotent — succeeds even when no connection exists", async () => {
    vi.mocked(prisma.linkedInConnection.deleteMany).mockResolvedValue({ count: 0 } as never);
    const res = await disconnectRoute();
    expect(res.status).toBe(200);
  });
});

// ─── /import ──────────────────────────────────────────────────────────────────

describe("POST /api/integrations/linkedin/import", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const res = await importRoute();
    expect(res.status).toBe(401);
  });

  it("returns 403 on free plan", async () => {
    vi.mocked(getUserPlan).mockResolvedValue("free");
    const res = await importRoute();
    expect(res.status).toBe(403);
  });

  it("returns 400 when no LinkedIn connection exists", async () => {
    vi.mocked(prisma.linkedInConnection.findUnique).mockResolvedValue(null as never);
    const res = await importRoute();
    expect(res.status).toBe(400);
  });

  it("creates a resume from the LinkedIn profile and returns its ID", async () => {
    vi.mocked(prisma.linkedInConnection.findUnique).mockResolvedValue(
      CONNECTION as never
    );
    vi.mocked(fetchLinkedInProfile).mockResolvedValue({
      sub: "li_sub_123",
      name: "Jane Doe",
      email: "jane@example.com",
    });
    vi.mocked(prisma.resume.create).mockResolvedValue({ id: "resume_new" } as never);
    vi.mocked(prisma.linkedInConnection.update).mockResolvedValue({} as never);

    const res = await importRoute();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.resumeId).toBe("resume_new");
    expect(prisma.resume.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: SESSION.user.id,
          title: expect.stringContaining("Jane Doe"),
        }),
      })
    );
  });

  it("returns 502 when LinkedIn profile fetch fails", async () => {
    vi.mocked(prisma.linkedInConnection.findUnique).mockResolvedValue(
      CONNECTION as never
    );
    vi.mocked(fetchLinkedInProfile).mockRejectedValue(new Error("Network error"));

    const res = await importRoute();
    expect(res.status).toBe(502);
  });
});

// ─── /publish ─────────────────────────────────────────────────────────────────

describe("POST /api/integrations/linkedin/publish", () => {
  function makeRequest(body: unknown) {
    return new Request("https://retold.dev/api/integrations/linkedin/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const res = await publishRoute(
      makeRequest({ type: "headline", text: "My headline" })
    );
    expect(res.status).toBe(401);
  });

  it("returns 403 on free plan", async () => {
    vi.mocked(getUserPlan).mockResolvedValue("free");
    const res = await publishRoute(
      makeRequest({ type: "headline", text: "My headline" })
    );
    expect(res.status).toBe(403);
  });

  it("returns 400 for invalid body (missing type)", async () => {
    const res = await publishRoute(makeRequest({ text: "text only" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when no LinkedIn connection exists", async () => {
    vi.mocked(prisma.linkedInConnection.findUnique).mockResolvedValue(null as never);
    const res = await publishRoute(
      makeRequest({ type: "headline", text: "My headline" })
    );
    expect(res.status).toBe(400);
  });

  it("returns 200 and posts headline to LinkedIn", async () => {
    vi.mocked(prisma.linkedInConnection.findUnique).mockResolvedValue(
      CONNECTION as never
    );
    vi.mocked(createLinkedInPost).mockResolvedValue({ postId: "urn:li:share:1" });

    const res = await publishRoute(
      makeRequest({ type: "headline", text: "Senior Engineer at Acme" })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);

    expect(createLinkedInPost).toHaveBeenCalledWith(
      CONNECTION.accessToken,
      `urn:li:person:${CONNECTION.linkedInId}`,
      expect.stringContaining("Senior Engineer at Acme")
    );
  });

  it("returns 200 and posts about section to LinkedIn", async () => {
    vi.mocked(prisma.linkedInConnection.findUnique).mockResolvedValue(
      CONNECTION as never
    );
    vi.mocked(createLinkedInPost).mockResolvedValue({ postId: "urn:li:share:2" });

    const res = await publishRoute(
      makeRequest({ type: "about", text: "A passionate engineer..." })
    );
    expect(res.status).toBe(200);
    expect(createLinkedInPost).toHaveBeenCalledWith(
      CONNECTION.accessToken,
      `urn:li:person:${CONNECTION.linkedInId}`,
      expect.stringContaining("About section")
    );
  });

  it("returns 502 when LinkedIn post creation fails", async () => {
    vi.mocked(prisma.linkedInConnection.findUnique).mockResolvedValue(
      CONNECTION as never
    );
    vi.mocked(createLinkedInPost).mockRejectedValue(new Error("LinkedIn API error"));

    const res = await publishRoute(
      makeRequest({ type: "headline", text: "headline text" })
    );
    expect(res.status).toBe(502);
  });
});
