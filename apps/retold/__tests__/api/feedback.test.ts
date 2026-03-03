import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/get-user-plan", () => ({
  getUserPlan: vi.fn().mockResolvedValue("starter"),
}));

vi.mock("@/lib/posthog", () => ({
  captureEvent: vi.fn(),
}));

import { POST } from "@/app/api/feedback/route";
import { auth } from "@/lib/auth";
import { getUserPlan } from "@/lib/get-user-plan";
import { captureEvent } from "@/lib/posthog";

const AUTHED_SESSION = {
  user: { id: "user_test123", email: "test@example.com" },
  expires: "2099-01-01",
};

function makeRequest(body: Record<string, unknown> = {}) {
  return new Request("http://localhost/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const VALID_BODY = {
  category: "feature_request",
  details: "Please add dark mode",
  pagePath: "/dashboard",
};

describe("POST /api/feedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(AUTHED_SESSION as never);
    vi.mocked(getUserPlan).mockResolvedValue("starter");
    vi.mocked(captureEvent).mockResolvedValue(undefined);
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(401);
  });

  it("returns 403 when user is on free plan", async () => {
    vi.mocked(getUserPlan).mockResolvedValue("free");
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(403);
  });

  it("returns 400 when category is missing", async () => {
    const res = await POST(
      makeRequest({ details: "some feedback", pagePath: "/dashboard" })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when details is empty", async () => {
    const res = await POST(
      makeRequest({ category: "other", details: "", pagePath: "/dashboard" })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when category is invalid", async () => {
    const res = await POST(
      makeRequest({ category: "invalid_cat", details: "test", pagePath: "/" })
    );
    expect(res.status).toBe(400);
  });

  it("returns 200 and sends PostHog event on success", async () => {
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ ok: true });

    expect(captureEvent).toHaveBeenCalledWith(
      "user_test123",
      "feedback_submitted",
      {
        category: "feature_request",
        details: "Please add dark mode",
        page_path: "/dashboard",
        plan: "starter",
      }
    );
  });

  it("works for pro and agency plans", async () => {
    for (const plan of ["pro", "agency"] as const) {
      vi.mocked(getUserPlan).mockResolvedValue(plan);
      const res = await POST(makeRequest(VALID_BODY));
      expect(res.status).toBe(200);
    }
  });

  it("accepts all valid categories", async () => {
    const categories = [
      "tailoring_quality",
      "keyword_matching",
      "export_formatting",
      "feature_request",
      "ui_usability",
      "other",
    ];
    for (const category of categories) {
      const res = await POST(
        makeRequest({ category, details: "test", pagePath: "/" })
      );
      expect(res.status).toBe(200);
    }
  });
});
