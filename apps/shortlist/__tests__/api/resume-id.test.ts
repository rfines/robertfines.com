import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    resume: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

import { GET, PATCH, DELETE } from "@/app/api/resumes/[resumeId]/route";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const AUTHED_SESSION = {
  user: { id: "user_test123", email: "test@example.com" },
  expires: "2099-01-01",
};

const RESUME = {
  id: "r1",
  userId: "user_test123",
  title: "My Resume",
  rawText: "Resume content",
  s3Key: null,
  fileType: null,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
};

const params = { params: Promise.resolve({ resumeId: "r1" }) };

function makeRequest(method: string, body?: unknown) {
  return new Request(`http://localhost/api/resumes/r1`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("GET /api/resumes/[resumeId]", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const res = await GET(makeRequest("GET"), params);
    expect(res.status).toBe(401);
  });

  it("returns 404 when resume does not belong to user", async () => {
    vi.mocked(auth).mockResolvedValue(AUTHED_SESSION as never);
    vi.mocked(prisma.resume.findFirst).mockResolvedValue(null as never);

    const res = await GET(makeRequest("GET"), params);
    expect(res.status).toBe(404);
  });

  it("returns 200 with resume data", async () => {
    vi.mocked(auth).mockResolvedValue(AUTHED_SESSION as never);
    vi.mocked(prisma.resume.findFirst).mockResolvedValue(RESUME as never);

    const res = await GET(makeRequest("GET"), params);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe("r1");
    expect(data.title).toBe("My Resume");
  });
});

describe("PATCH /api/resumes/[resumeId]", () => {
  beforeEach(() => {
    vi.mocked(auth).mockResolvedValue(AUTHED_SESSION as never);
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const res = await PATCH(makeRequest("PATCH", { title: "New" }), params);
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid JSON", async () => {
    const req = new Request("http://localhost/api/resumes/r1", {
      method: "PATCH",
      body: "not json",
    });
    const res = await PATCH(req, params);
    expect(res.status).toBe(400);
  });

  it("returns 400 when title is empty string", async () => {
    const res = await PATCH(makeRequest("PATCH", { title: "" }), params);
    expect(res.status).toBe(400);
  });

  it("returns 404 when resume does not belong to user", async () => {
    vi.mocked(prisma.resume.updateMany).mockResolvedValue({ count: 0 } as never);

    const res = await PATCH(makeRequest("PATCH", { title: "New Title" }), params);
    expect(res.status).toBe(404);
  });

  it("returns 200 with updated resume", async () => {
    vi.mocked(prisma.resume.updateMany).mockResolvedValue({ count: 1 } as never);
    vi.mocked(prisma.resume.findUnique).mockResolvedValue({
      ...RESUME,
      title: "New Title",
    } as never);

    const res = await PATCH(makeRequest("PATCH", { title: "New Title" }), params);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.title).toBe("New Title");
  });
});

describe("DELETE /api/resumes/[resumeId]", () => {
  beforeEach(() => {
    vi.mocked(auth).mockResolvedValue(AUTHED_SESSION as never);
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const res = await DELETE(makeRequest("DELETE"), params);
    expect(res.status).toBe(401);
  });

  it("returns 404 when resume does not belong to user", async () => {
    vi.mocked(prisma.resume.deleteMany).mockResolvedValue({ count: 0 } as never);
    const res = await DELETE(makeRequest("DELETE"), params);
    expect(res.status).toBe(404);
  });

  it("returns 204 on successful deletion", async () => {
    vi.mocked(prisma.resume.deleteMany).mockResolvedValue({ count: 1 } as never);
    const res = await DELETE(makeRequest("DELETE"), params);
    expect(res.status).toBe(204);
  });

  it("deletes only the resume belonging to the user", async () => {
    vi.mocked(prisma.resume.deleteMany).mockResolvedValue({ count: 1 } as never);
    await DELETE(makeRequest("DELETE"), params);

    expect(prisma.resume.deleteMany).toHaveBeenCalledWith({
      where: { id: "r1", userId: "user_test123" },
    });
  });
});
