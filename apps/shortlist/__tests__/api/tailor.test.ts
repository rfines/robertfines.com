import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    resume: {
      findFirst: vi.fn(),
    },
    tailoredResume: {
      createManyAndReturn: vi.fn(),
    },
  },
}));

vi.mock("@/lib/tailor-resume", () => ({
  tailorResume: vi.fn(),
}));

vi.mock("@/lib/posthog", () => ({
  captureEvent: vi.fn(),
}));

vi.mock("@/lib/get-user-plan", () => ({
  getUserPlan: vi.fn().mockResolvedValue("free"),
}));

import { POST } from "@/app/api/tailor/route";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tailorResume } from "@/lib/tailor-resume";
import { getUserPlan } from "@/lib/get-user-plan";

const AUTHED_SESSION = {
  user: { id: "user_test123", email: "test@example.com" },
  expires: "2099-01-01",
};

const RESUME = {
  id: "clxxxxxxxxxxxxxxxxxxxxxx",
  userId: "user_test123",
  title: "My Resume",
  rawText: "Base resume content",
};

const VALID_BODY = {
  resumeId: "clxxxxxxxxxxxxxxxxxxxxxx",
  jobTitle: "Senior Engineer",
  company: "Acme Corp",
  jobDescription: "We need a great engineer.",
};

const CREATED_RECORD = {
  id: "t1",
  ...VALID_BODY,
  userId: "user_test123",
  tailoredText: "Tailored resume content",
  tokensUsed: 150,
  variationGroup: null,
  variationIndex: 0,
  userInstructions: null,
  createdAt: new Date("2025-01-01"),
};

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/tailor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/tailor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(AUTHED_SESSION as never);
    vi.mocked(prisma.resume.findFirst).mockResolvedValue(RESUME as never);
    vi.mocked(getUserPlan).mockResolvedValue("free");
    vi.mocked(tailorResume).mockResolvedValue({
      tailoredText: "Tailored resume content",
      tokensUsed: 150,
    });
    vi.mocked(prisma.tailoredResume.createManyAndReturn).mockResolvedValue([
      CREATED_RECORD,
    ] as never);
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(401);
  });

  it("returns 400 when body is invalid (missing fields)", async () => {
    const res = await POST(makeRequest({ jobTitle: "Engineer" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when resumeId is not a CUID", async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, resumeId: "not-a-cuid" }));
    expect(res.status).toBe(400);
  });

  it("returns 404 when resume is not found for user", async () => {
    vi.mocked(prisma.resume.findFirst).mockResolvedValue(null as never);
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe("Resume not found");
  });

  it("returns 201 with the created tailored resume", async () => {
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.id).toBe("t1");
    expect(data.tailoredText).toBe("Tailored resume content");
  });

  it("passes base resume text to tailorResume", async () => {
    await POST(makeRequest(VALID_BODY));
    expect(tailorResume).toHaveBeenCalledWith(
      expect.objectContaining({ baseResume: "Base resume content" })
    );
  });

  it("saves tokensUsed from tailorResume result", async () => {
    await POST(makeRequest(VALID_BODY));
    expect(prisma.tailoredResume.createManyAndReturn).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ tokensUsed: 150 }),
        ]),
      })
    );
  });

  it("returns 403 when free user submits userInstructions", async () => {
    vi.mocked(getUserPlan).mockResolvedValue("free");
    const res = await POST(
      makeRequest({ ...VALID_BODY, userInstructions: "Emphasize leadership" })
    );
    expect(res.status).toBe(403);
  });

  it("allows userInstructions for starter plan", async () => {
    vi.mocked(getUserPlan).mockResolvedValue("starter");
    const res = await POST(
      makeRequest({ ...VALID_BODY, userInstructions: "Emphasize leadership" })
    );
    expect(res.status).toBe(201);
  });

  it("caps variations to plan limit for free users", async () => {
    vi.mocked(getUserPlan).mockResolvedValue("free");
    await POST(makeRequest({ ...VALID_BODY, variations: 3 }));
    // Free plan limit is 1, so tailorResume should be called once
    expect(tailorResume).toHaveBeenCalledTimes(1);
  });

  it("allows 2 variations for starter plan", async () => {
    vi.mocked(getUserPlan).mockResolvedValue("starter");
    vi.mocked(prisma.tailoredResume.createManyAndReturn).mockResolvedValue([
      CREATED_RECORD,
      { ...CREATED_RECORD, id: "t2", variationIndex: 1 },
    ] as never);
    await POST(makeRequest({ ...VALID_BODY, variations: 2 }));
    expect(tailorResume).toHaveBeenCalledTimes(2);
  });
});
