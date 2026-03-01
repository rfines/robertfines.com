import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    tailoredResume: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    resume: {
      findFirst: vi.fn(),
    },
  },
}));
vi.mock("@/lib/get-user-plan", () => ({
  getUserPlan: vi.fn().mockResolvedValue("starter"),
}));
vi.mock("@/lib/posthog", () => ({ captureEvent: vi.fn() }));
vi.mock("@/lib/generate-gap-analysis", () => ({
  generateGapAnalysis: vi.fn(),
}));
vi.mock("@/lib/extract-jd-skills", () => ({
  extractJdSkills: vi.fn(),
}));

import { POST as gapAnalysisRoute } from "@/app/api/tailored/[tailoredId]/gap-analysis/route";
import { POST as quickFitRoute } from "@/app/api/resumes/[resumeId]/quick-fit/route";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserPlan } from "@/lib/get-user-plan";
import { generateGapAnalysis } from "@/lib/generate-gap-analysis";
import { extractJdSkills } from "@/lib/extract-jd-skills";

const SESSION = {
  user: { id: "user_test", email: "test@example.com" },
  expires: "2099-01-01",
};

const TAILORED = {
  id: "t1",
  userId: "user_test",
  jobTitle: "Senior Engineer",
  company: "Acme",
  jobDescription: "We need a TypeScript engineer with React and Node.js experience.",
  tailoredText: "Experienced engineer with TypeScript skills.",
  gapAnalysis: null,
  resume: { rawText: "Engineer with TypeScript and React experience." },
};

const GAP_ANALYSIS_RESULT = {
  gaps: [
    {
      requirement: "Node.js experience",
      suggestion: "Add a bullet highlighting your Node.js backend work.",
      section: "Work Experience",
      priority: "high" as const,
    },
  ],
  skillsToAdd: ["Node.js"],
  tokensUsed: 500,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(auth).mockResolvedValue(SESSION as never);
  vi.mocked(getUserPlan).mockResolvedValue("starter");
});

// ─── /gap-analysis ────────────────────────────────────────────────────────────

describe("POST /api/tailored/[tailoredId]/gap-analysis", () => {
  const PARAMS = { params: Promise.resolve({ tailoredId: "t1" }) };

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const res = await gapAnalysisRoute(new Request("http://localhost"), PARAMS);
    expect(res.status).toBe(401);
  });

  it("returns 403 on free plan", async () => {
    vi.mocked(getUserPlan).mockResolvedValue("free");
    const res = await gapAnalysisRoute(new Request("http://localhost"), PARAMS);
    expect(res.status).toBe(403);
  });

  it("returns 404 when tailored resume not found", async () => {
    vi.mocked(prisma.tailoredResume.findFirst).mockResolvedValue(null as never);
    const res = await gapAnalysisRoute(new Request("http://localhost"), PARAMS);
    expect(res.status).toBe(404);
  });

  it("returns cached analysis when already generated (idempotent)", async () => {
    const cached = { gaps: [], skillsToAdd: ["React"] };
    vi.mocked(prisma.tailoredResume.findFirst).mockResolvedValue({
      ...TAILORED,
      gapAnalysis: JSON.stringify(cached),
    } as never);

    const res = await gapAnalysisRoute(new Request("http://localhost"), PARAMS);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.gapAnalysis.skillsToAdd).toContain("React");
    expect(generateGapAnalysis).not.toHaveBeenCalled();
  });

  it("generates and stores gap analysis on first request", async () => {
    vi.mocked(prisma.tailoredResume.findFirst).mockResolvedValue(TAILORED as never);
    vi.mocked(generateGapAnalysis).mockResolvedValue(GAP_ANALYSIS_RESULT);
    vi.mocked(prisma.tailoredResume.update).mockResolvedValue({} as never);

    const res = await gapAnalysisRoute(new Request("http://localhost"), PARAMS);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.gapAnalysis.gaps).toHaveLength(1);
    expect(data.gapAnalysis.gaps[0].requirement).toBe("Node.js experience");
    expect(data.gapAnalysis.skillsToAdd).toContain("Node.js");

    // Should persist to DB (without tokensUsed)
    expect(prisma.tailoredResume.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "t1" },
        data: expect.objectContaining({
          gapAnalysis: expect.stringContaining("Node.js"),
        }),
      })
    );
  });

  it("calls generateGapAnalysis with correct arguments", async () => {
    vi.mocked(prisma.tailoredResume.findFirst).mockResolvedValue(TAILORED as never);
    vi.mocked(generateGapAnalysis).mockResolvedValue(GAP_ANALYSIS_RESULT);
    vi.mocked(prisma.tailoredResume.update).mockResolvedValue({} as never);

    await gapAnalysisRoute(new Request("http://localhost"), PARAMS);

    expect(generateGapAnalysis).toHaveBeenCalledWith(
      expect.objectContaining({
        jobTitle: "Senior Engineer",
        company: "Acme",
        tailoredText: TAILORED.tailoredText,
        resumeText: TAILORED.resume.rawText,
      })
    );
  });
});

// ─── /quick-fit ───────────────────────────────────────────────────────────────

describe("POST /api/resumes/[resumeId]/quick-fit", () => {
  const PARAMS = { params: Promise.resolve({ resumeId: "r1" }) };
  const RESUME = { rawText: "Engineer with TypeScript and React." };

  function makeRequest(body: unknown) {
    return new Request("http://localhost/api/resumes/r1/quick-fit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const res = await quickFitRoute(
      makeRequest({ jobDescription: "We need TypeScript and React skills." }),
      PARAMS
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 for missing or too-short job description", async () => {
    const res = await quickFitRoute(makeRequest({ jobDescription: "short" }), PARAMS);
    expect(res.status).toBe(400);
  });

  it("returns 404 when resume not found", async () => {
    vi.mocked(prisma.resume.findFirst).mockResolvedValue(null as never);
    const res = await quickFitRoute(
      makeRequest({
        jobDescription: "We need a TypeScript and React engineer with Node.js experience.",
      }),
      PARAMS
    );
    expect(res.status).toBe(404);
  });

  it("returns a score with matched and missing arrays", async () => {
    vi.mocked(prisma.resume.findFirst).mockResolvedValue(RESUME as never);
    vi.mocked(extractJdSkills).mockResolvedValue(["TypeScript", "React", "Node.js"]);

    const res = await quickFitRoute(
      makeRequest({
        jobDescription:
          "We need a TypeScript and React engineer with Node.js experience.",
      }),
      PARAMS
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(typeof data.score).toBe("number");
    expect(Array.isArray(data.matched)).toBe(true);
    expect(Array.isArray(data.missing)).toBe(true);
    expect(data.matched).toContain("TypeScript");
    expect(data.matched).toContain("React");
    expect(data.missing).toContain("Node.js");
  });

  it("returns 422 when no skills can be extracted", async () => {
    vi.mocked(prisma.resume.findFirst).mockResolvedValue(RESUME as never);
    vi.mocked(extractJdSkills).mockResolvedValue([]);

    const res = await quickFitRoute(
      makeRequest({
        jobDescription:
          "We are looking for a great person with good energy who loves working hard.",
      }),
      PARAMS
    );
    expect(res.status).toBe(422);
  });
});
