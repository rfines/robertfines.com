import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { GET } from "@/app/api/admin/users/route";
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

const MOCK_USERS = [
  { id: "u1", name: "Alice", email: "alice@example.com", plan: "free", role: "user", createdAt: new Date(), _count: { resumes: 2, tailoredResumes: 5 } },
];

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL("http://localhost/api/admin/users");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new Request(url.toString());
}

describe("GET /api/admin/users", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(ADMIN_SESSION as never);
    vi.mocked(prisma.user.findMany).mockResolvedValue(MOCK_USERS as never);
    vi.mocked(prisma.user.count).mockResolvedValue(1);
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it("returns 403 when authenticated as non-admin", async () => {
    vi.mocked(auth).mockResolvedValue(USER_SESSION as never);
    const res = await GET(makeRequest());
    expect(res.status).toBe(403);
  });

  it("returns 200 with { users, total, page } shape", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.total).toBe(1);
    expect(data.page).toBe(1);
    expect(data.users).toHaveLength(1);
    expect(data.users[0]).toMatchObject({ id: "u1", email: "alice@example.com", plan: "free" });
  });

  it("passes q param to prisma where clause", async () => {
    await GET(makeRequest({ q: "alice" }));
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ OR: expect.any(Array) }),
      })
    );
  });

  it("uses skip=0 for page 1 (default)", async () => {
    await GET(makeRequest());
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 50 })
    );
  });

  it("uses skip=50 for page 2", async () => {
    await GET(makeRequest({ page: "2" }));
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 50, take: 50 })
    );
  });
});
