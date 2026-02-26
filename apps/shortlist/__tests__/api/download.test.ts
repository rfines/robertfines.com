import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tailoredResume: {
      findFirst: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/generate-docx", () => ({
  generateDocx: vi.fn().mockResolvedValue(Buffer.from("docx content")),
}));

vi.mock("@/lib/generate-markdown", () => ({
  generateMarkdown: vi.fn().mockReturnValue("# Title\n\ncontent"),
}));

vi.mock("@/lib/generate-pdf", () => ({
  generatePdf: vi.fn().mockResolvedValue(Buffer.from("pdf content")),
}));

vi.mock("@/lib/posthog", () => ({
  captureEvent: vi.fn(),
}));

vi.mock("@/lib/get-user-plan", () => ({
  getUserPlan: vi.fn().mockResolvedValue("free"),
}));

import { GET } from "@/app/api/tailored/[tailoredId]/download/route";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserPlan } from "@/lib/get-user-plan";

const AUTHED_SESSION = {
  user: { id: "user_test123", email: "test@example.com" },
  expires: "2099-01-01",
};

const TAILORED = {
  id: "t1",
  userId: "user_test123",
  resumeId: "r1",
  jobTitle: "Senior Engineer",
  company: "Acme",
  jobDescription: "Great job",
  tailoredText: "Tailored content",
  intensity: "moderate",
  tokensUsed: 100,
  createdAt: new Date("2025-01-01"),
};

const params = { params: Promise.resolve({ tailoredId: "t1" }) };

function makeRequest(format?: string) {
  const url = format
    ? `http://localhost/api/tailored/t1/download?format=${format}`
    : "http://localhost/api/tailored/t1/download";
  return new Request(url, { method: "GET" });
}

describe("GET /api/tailored/[tailoredId]/download", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(AUTHED_SESSION as never);
    vi.mocked(prisma.tailoredResume.findFirst).mockResolvedValue(TAILORED as never);
    vi.mocked(getUserPlan).mockResolvedValue("free");
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const res = await GET(makeRequest(), params);
    expect(res.status).toBe(401);
  });

  it("returns 404 when tailored resume not found", async () => {
    vi.mocked(prisma.tailoredResume.findFirst).mockResolvedValue(null as never);
    const res = await GET(makeRequest(), params);
    expect(res.status).toBe(404);
  });

  it("returns docx by default", async () => {
    const res = await GET(makeRequest(), params);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("wordprocessingml");
  });

  it("returns docx when format=docx", async () => {
    const res = await GET(makeRequest("docx"), params);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("wordprocessingml");
  });

  it("returns 400 for invalid format", async () => {
    const res = await GET(makeRequest("xlsx"), params);
    expect(res.status).toBe(400);
  });

  it("returns 403 for markdown when on free plan", async () => {
    vi.mocked(getUserPlan).mockResolvedValue("free");
    const res = await GET(makeRequest("md"), params);
    expect(res.status).toBe(403);
  });

  it("returns 403 for pdf when on free plan", async () => {
    vi.mocked(getUserPlan).mockResolvedValue("free");
    const res = await GET(makeRequest("pdf"), params);
    expect(res.status).toBe(403);
  });

  it("returns 403 for pdf when on starter plan", async () => {
    vi.mocked(getUserPlan).mockResolvedValue("starter");
    const res = await GET(makeRequest("pdf"), params);
    expect(res.status).toBe(403);
  });

  it("returns markdown for starter plan", async () => {
    vi.mocked(getUserPlan).mockResolvedValue("starter");
    const res = await GET(makeRequest("md"), params);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/markdown");
  });

  it("returns pdf for pro plan", async () => {
    vi.mocked(getUserPlan).mockResolvedValue("pro");
    const res = await GET(makeRequest("pdf"), params);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
  });
});
