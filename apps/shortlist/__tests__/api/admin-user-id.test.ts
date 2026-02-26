import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/posthog", () => ({
  captureEvent: vi.fn(),
}));

import { GET, PATCH } from "@/app/api/admin/users/[userId]/route";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { captureEvent } from "@/lib/posthog";

const ADMIN_SESSION = {
  user: { id: "admin_001", email: "admin@example.com", role: "admin" },
  expires: "2099-01-01",
};

const USER_SESSION = {
  user: { id: "user_001", email: "user@example.com", role: "user" },
  expires: "2099-01-01",
};

const MOCK_USER = {
  id: "target_001",
  name: "Bob",
  email: "bob@example.com",
  plan: "free",
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
  resumes: [],
  tailoredResumes: [],
};

const params = { params: Promise.resolve({ userId: "target_001" }) };

function makeRequest(method: string, body?: unknown) {
  return new Request("http://localhost/api/admin/users/target_001", {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("GET /api/admin/users/[userId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(ADMIN_SESSION as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(MOCK_USER as never);
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const res = await GET(makeRequest("GET"), params);
    expect(res.status).toBe(401);
  });

  it("returns 403 for non-admin", async () => {
    vi.mocked(auth).mockResolvedValue(USER_SESSION as never);
    const res = await GET(makeRequest("GET"), params);
    expect(res.status).toBe(403);
  });

  it("returns 404 when user not found", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null as never);
    const res = await GET(makeRequest("GET"), params);
    expect(res.status).toBe(404);
  });

  it("returns 200 with user data", async () => {
    const res = await GET(makeRequest("GET"), params);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe("target_001");
  });
});

describe("PATCH /api/admin/users/[userId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(ADMIN_SESSION as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "target_001" } as never);
    vi.mocked(prisma.user.update).mockResolvedValue({
      id: "target_001",
      email: "bob@example.com",
      plan: "starter",
      role: "user",
    } as never);
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const res = await PATCH(makeRequest("PATCH", { plan: "starter" }), params);
    expect(res.status).toBe(401);
  });

  it("returns 403 for non-admin", async () => {
    vi.mocked(auth).mockResolvedValue(USER_SESSION as never);
    const res = await PATCH(makeRequest("PATCH", { plan: "starter" }), params);
    expect(res.status).toBe(403);
  });

  it("returns 400 for empty body (no plan or role)", async () => {
    const res = await PATCH(makeRequest("PATCH", {}), params);
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid plan value", async () => {
    const res = await PATCH(makeRequest("PATCH", { plan: "enterprise" }), params);
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid role value", async () => {
    const res = await PATCH(makeRequest("PATCH", { role: "superadmin" }), params);
    expect(res.status).toBe(400);
  });

  it("returns 404 when target user not found", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null as never);
    const res = await PATCH(makeRequest("PATCH", { plan: "starter" }), params);
    expect(res.status).toBe(404);
  });

  it("returns 200 when updating plan only", async () => {
    const res = await PATCH(makeRequest("PATCH", { plan: "starter" }), params);
    expect(res.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ plan: "starter" }) })
    );
  });

  it("returns 200 when updating role only", async () => {
    vi.mocked(prisma.user.update).mockResolvedValue({
      id: "target_001",
      email: "bob@example.com",
      plan: "free",
      role: "admin",
    } as never);
    const res = await PATCH(makeRequest("PATCH", { role: "admin" }), params);
    expect(res.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ role: "admin" }) })
    );
  });

  it("calls captureEvent with admin_user_updated and targetUserId", async () => {
    await PATCH(makeRequest("PATCH", { plan: "pro" }), params);
    expect(captureEvent).toHaveBeenCalledWith(
      ADMIN_SESSION.user.id,
      "admin_user_updated",
      expect.objectContaining({ targetUserId: "target_001" })
    );
  });
});
