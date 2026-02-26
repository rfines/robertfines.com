import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    resume: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/posthog", () => ({
  captureEvent: vi.fn(),
}));

import { GET, POST } from "@/app/api/resumes/route";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const AUTHED_SESSION = {
  user: { id: "user_test123", email: "test@example.com" },
  expires: "2099-01-01",
};

const RESUME_ROW = {
  id: "r1",
  userId: "user_test123",
  title: "My Resume",
  fileType: null,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
};

function makeRequest(body?: unknown) {
  return new Request("http://localhost/api/resumes", {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("GET /api/resumes", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    const res = await GET();
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 200 with user resumes", async () => {
    vi.mocked(auth).mockResolvedValue(AUTHED_SESSION as never);
    vi.mocked(prisma.resume.findMany).mockResolvedValue([RESUME_ROW] as never);

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(1);
    expect(data[0].id).toBe("r1");
  });

  it("queries with the authenticated user's id", async () => {
    vi.mocked(auth).mockResolvedValue(AUTHED_SESSION as never);
    vi.mocked(prisma.resume.findMany).mockResolvedValue([] as never);

    await GET();
    expect(prisma.resume.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user_test123" },
      })
    );
  });
});

describe("POST /api/resumes", () => {
  beforeEach(() => {
    vi.mocked(auth).mockResolvedValue(AUTHED_SESSION as never);
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    const res = await POST(makeRequest({ title: "x", rawText: "y" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid JSON body", async () => {
    const req = new Request("http://localhost/api/resumes", {
      method: "POST",
      body: "not json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid JSON");
  });

  it("returns 400 when title is missing", async () => {
    const res = await POST(makeRequest({ rawText: "content" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when rawText is empty", async () => {
    const res = await POST(makeRequest({ title: "My Resume", rawText: "" }));
    expect(res.status).toBe(400);
  });

  it("returns 201 and creates resume with userId", async () => {
    const created = { ...RESUME_ROW, rawText: "Resume content" };
    vi.mocked(prisma.resume.create).mockResolvedValue(created as never);

    const res = await POST(
      makeRequest({ title: "My Resume", rawText: "Resume content" })
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.id).toBe("r1");

    expect(prisma.resume.create).toHaveBeenCalledWith({
      data: {
        userId: "user_test123",
        title: "My Resume",
        rawText: "Resume content",
      },
    });
  });
});
