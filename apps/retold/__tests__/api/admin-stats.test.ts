import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      count: vi.fn(),
      groupBy: vi.fn(),
      findMany: vi.fn(),
    },
    resume: {
      count: vi.fn(),
    },
    tailoredResume: {
      count: vi.fn(),
    },
  },
}));

import { GET } from "@/app/api/admin/stats/route";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_SESSION = {
  user: { id: "admin_001", email: "admin@example.com", role: "admin" },
  expires: "2099-01-01",
};

const USER_SESSION = {
  user: { id: "user_001", email: "user@example.com", role: "user" },
  expires: "2099-01-01",
};

function makeRequest() {
  return new Request("http://localhost/api/admin/stats");
}

describe("GET /api/admin/stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(ADMIN_SESSION as never);
    vi.mocked(prisma.user.count).mockResolvedValue(42);
    vi.mocked(prisma.user.groupBy).mockResolvedValue([
      { plan: "free", _count: { plan: 30 } },
      { plan: "starter", _count: { plan: 8 } },
      { plan: "pro", _count: { plan: 4 } },
    ] as never);
    vi.mocked(prisma.resume.count).mockResolvedValue(130);
    vi.mocked(prisma.tailoredResume.count).mockResolvedValue(410);
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { id: "u1", email: "a@example.com", name: "Alice", plan: "free", createdAt: new Date() },
    ] as never);
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 403 when authenticated as non-admin", async () => {
    vi.mocked(auth).mockResolvedValue(USER_SESSION as never);
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("returns 200 with correct shape for admin", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toMatchObject({
      totalUsers: 42,
      totalResumes: 130,
      totalTailored: 410,
      planDistribution: { free: 30, starter: 8, pro: 4 },
    });
    expect(Array.isArray(data.recentSignups)).toBe(true);
  });

  it("converts groupBy array to a flat planDistribution object", async () => {
    const res = await GET();
    const data = await res.json();
    // Must be a flat object, not the raw groupBy array
    expect(typeof data.planDistribution).toBe("object");
    expect(Array.isArray(data.planDistribution)).toBe(false);
    expect(data.planDistribution.free).toBe(30);
  });
});
