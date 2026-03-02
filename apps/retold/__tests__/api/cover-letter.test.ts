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

vi.mock("@/lib/generate-cover-letter", () => ({
  generateCoverLetter: vi.fn(),
}));

vi.mock("@/lib/posthog", () => ({
  captureEvent: vi.fn(),
}));

vi.mock("@/lib/get-user-plan", () => ({
  getUserPlan: vi.fn().mockResolvedValue("starter"),
}));

import { POST } from "@/app/api/tailored/[tailoredId]/cover-letter/route";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateCoverLetter } from "@/lib/generate-cover-letter";
import { getUserPlan } from "@/lib/get-user-plan";

const AUTHED_SESSION = {
  user: { id: "user_test123", email: "test@example.com" },
  expires: "2099-01-01",
};

const TAILORED_RESUME = {
  id: "t1",
  userId: "user_test123",
  jobTitle: "Senior Engineer",
  company: "Acme",
  jobDescription: "We need a senior engineer.",
  tailoredText: "Tailored resume content.",
  coverLetterText: null,
  coverLetterTokensUsed: null,
};

function makeRequest() {
  return new Request("http://localhost/api/tailored/t1/cover-letter", {
    method: "POST",
  });
}

const PARAMS = { params: Promise.resolve({ tailoredId: "t1" }) };

describe("POST /api/tailored/[tailoredId]/cover-letter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(AUTHED_SESSION as never);
    vi.mocked(getUserPlan).mockResolvedValue("starter");
    vi.mocked(prisma.tailoredResume.findFirst).mockResolvedValue(
      TAILORED_RESUME as never
    );
    vi.mocked(generateCoverLetter).mockResolvedValue({
      coverLetterText: "Dear Hiring Manager, I am excited to apply.",
      tokensUsed: 300,
    });
    vi.mocked(prisma.tailoredResume.update).mockResolvedValue({
      ...TAILORED_RESUME,
      coverLetterText: "Dear Hiring Manager, I am excited to apply.",
      coverLetterTokensUsed: 300,
    } as never);
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const res = await POST(makeRequest(), PARAMS);
    expect(res.status).toBe(401);
  });

  it("returns 403 when user is on free plan", async () => {
    vi.mocked(getUserPlan).mockResolvedValue("free");
    const res = await POST(makeRequest(), PARAMS);
    expect(res.status).toBe(403);
  });

  it("returns 404 when tailored resume is not found", async () => {
    vi.mocked(prisma.tailoredResume.findFirst).mockResolvedValue(null as never);
    const res = await POST(makeRequest(), PARAMS);
    expect(res.status).toBe(404);
  });

  it("returns 200 with generated cover letter text", async () => {
    const res = await POST(makeRequest(), PARAMS);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.coverLetterText).toBe(
      "Dear Hiring Manager, I am excited to apply."
    );
  });

  it("does not call Claude if cover letter already exists (idempotent)", async () => {
    vi.mocked(prisma.tailoredResume.findFirst).mockResolvedValue({
      ...TAILORED_RESUME,
      coverLetterText: "Existing cover letter text.",
      coverLetterTokensUsed: 200,
    } as never);

    const res = await POST(makeRequest(), PARAMS);
    expect(res.status).toBe(200);
    expect(generateCoverLetter).not.toHaveBeenCalled();
    const data = await res.json();
    expect(data.coverLetterText).toBe("Existing cover letter text.");
  });

  it("passes tailored resume and job details to generateCoverLetter", async () => {
    await POST(makeRequest(), PARAMS);
    expect(generateCoverLetter).toHaveBeenCalledWith(
      expect.objectContaining({
        tailoredResume: "Tailored resume content.",
        jobTitle: "Senior Engineer",
        company: "Acme",
        jobDescription: "We need a senior engineer.",
      })
    );
  });

  it("updates the tailoredResume record with the generated text", async () => {
    await POST(makeRequest(), PARAMS);
    expect(prisma.tailoredResume.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "t1" },
        data: expect.objectContaining({
          coverLetterText: "Dear Hiring Manager, I am excited to apply.",
          coverLetterTokensUsed: 300,
        }),
      })
    );
  });
});
