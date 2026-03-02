import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tailoredResume: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/tailor-resume", () => ({
  tailorResume: vi.fn(),
}));

vi.mock("@/lib/posthog", () => ({
  captureEvent: vi.fn(),
}));

import { POST } from "@/app/api/admin/users/[userId]/tailored/[tailoredId]/reprocess/route";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tailorResume } from "@/lib/tailor-resume";
import { captureEvent } from "@/lib/posthog";

const ADMIN_SESSION = {
  user: { id: "admin_001", email: "admin@example.com", role: "admin" },
  expires: "2099-01-01",
};

const USER_SESSION = {
  user: { id: "user_001", email: "user@example.com", role: "user" },
  expires: "2099-01-01",
};

const TAILORED = {
  id: "t1",
  userId: "target_001",
  resumeId: "r1",
  jobTitle: "Senior Engineer",
  company: "Acme",
  jobDescription: "Build great things.",
  tailoredText: "Old tailored text",
  intensity: "moderate",
  userInstructions: null,
  tokensUsed: 100,
  createdAt: new Date(),
  resume: { rawText: "Base resume content" },
};

const params = {
  params: Promise.resolve({ userId: "target_001", tailoredId: "t1" }),
};

function makeRequest() {
  return new Request(
    "http://localhost/api/admin/users/target_001/tailored/t1/reprocess",
    { method: "POST" }
  );
}

describe("POST /api/admin/users/[userId]/tailored/[tailoredId]/reprocess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(ADMIN_SESSION as never);
    vi.mocked(prisma.tailoredResume.findFirst).mockResolvedValue(TAILORED as never);
    vi.mocked(tailorResume).mockResolvedValue({
      tailoredText: "New tailored text",
      tokensUsed: 120,
    });
    vi.mocked(prisma.tailoredResume.update).mockResolvedValue({
      ...TAILORED,
      tailoredText: "New tailored text",
      tokensUsed: 120,
    } as never);
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const res = await POST(makeRequest(), params);
    expect(res.status).toBe(401);
  });

  it("returns 403 for non-admin", async () => {
    vi.mocked(auth).mockResolvedValue(USER_SESSION as never);
    const res = await POST(makeRequest(), params);
    expect(res.status).toBe(403);
  });

  it("returns 404 when tailored resume not found", async () => {
    vi.mocked(prisma.tailoredResume.findFirst).mockResolvedValue(null as never);
    const res = await POST(makeRequest(), params);
    expect(res.status).toBe(404);
  });

  it("returns 200 with updated tailored resume", async () => {
    const res = await POST(makeRequest(), params);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.tailoredText).toBe("New tailored text");
  });

  it("calls tailorResume with correct inputs from DB record", async () => {
    await POST(makeRequest(), params);
    expect(tailorResume).toHaveBeenCalledWith(
      expect.objectContaining({
        baseResume: "Base resume content",
        jobTitle: "Senior Engineer",
        company: "Acme",
        jobDescription: "Build great things.",
        intensity: "moderate",
      })
    );
  });

  it("defaults intensity to 'moderate' when stored value is null", async () => {
    vi.mocked(prisma.tailoredResume.findFirst).mockResolvedValue({
      ...TAILORED,
      intensity: null,
    } as never);
    await POST(makeRequest(), params);
    expect(tailorResume).toHaveBeenCalledWith(
      expect.objectContaining({ intensity: "moderate" })
    );
  });

  it("passes userInstructions when present", async () => {
    vi.mocked(prisma.tailoredResume.findFirst).mockResolvedValue({
      ...TAILORED,
      userInstructions: "Emphasize leadership",
    } as never);
    await POST(makeRequest(), params);
    expect(tailorResume).toHaveBeenCalledWith(
      expect.objectContaining({ userInstructions: "Emphasize leadership" })
    );
  });

  it("updates the record in place with new tailoredText and tokensUsed", async () => {
    await POST(makeRequest(), params);
    expect(prisma.tailoredResume.update).toHaveBeenCalledWith({
      where: { id: "t1" },
      data: { tailoredText: "New tailored text", tokensUsed: 120 },
    });
  });

  it("calls captureEvent with admin_reprocess and correct ids", async () => {
    await POST(makeRequest(), params);
    expect(captureEvent).toHaveBeenCalledWith(
      ADMIN_SESSION.user.id,
      "admin_reprocess",
      expect.objectContaining({
        tailoredId: "t1",
        targetUserId: "target_001",
        tokensUsed: 120,
      })
    );
  });
});
