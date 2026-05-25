import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    album: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

import type { Mock } from "vitest";
import { createAlbum, updateAlbum, deleteAlbum } from "@/lib/albums";
import { prisma } from "@/lib/prisma";
import { auth as authImport } from "@/lib/auth";
import { revalidatePath } from "next/cache";

type FakeSession = { user: { email: string }; expires: string } | null;
const auth = authImport as unknown as Mock<() => Promise<FakeSession>>;

function validFormData(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  const base: Record<string, string> = {
    title: "Blue",
    artist: "Joni Mitchell",
    year: "1971",
    genre: "Folk",
    format: "vinyl",
    label: "Reprise",
    coverImageUrl: "",
    rating: "5",
    notes: "",
    ...overrides,
  };
  for (const [k, v] of Object.entries(base)) fd.set(k, v);
  return fd;
}

const allowlistedEmail = "admin@example.com";

beforeEach(() => {
  vi.clearAllMocks();
  process.env.ADMIN_EMAILS = allowlistedEmail;
});

describe("createAlbum authorization", () => {
  it("throws Unauthorized when no session", async () => {
    auth.mockResolvedValue(null);
    await expect(createAlbum(validFormData())).rejects.toThrow("Unauthorized");
    expect(prisma.album.create).not.toHaveBeenCalled();
  });

  it("throws Unauthorized when session email is not in allowlist", async () => {
    auth.mockResolvedValue({
      user: { email: "intruder@example.com" },
      expires: "9999-01-01T00:00:00Z",
    });
    await expect(createAlbum(validFormData())).rejects.toThrow("Unauthorized");
    expect(prisma.album.create).not.toHaveBeenCalled();
  });

  it("creates and revalidates when allowlisted", async () => {
    auth.mockResolvedValue({
      user: { email: allowlistedEmail },
      expires: "9999-01-01T00:00:00Z",
    });
    vi.mocked(prisma.album.create).mockResolvedValue({
      id: "abc",
    } as unknown as Awaited<ReturnType<typeof prisma.album.create>>);

    const result = await createAlbum(validFormData());

    expect(result.ok).toBe(true);
    expect(prisma.album.create).toHaveBeenCalledOnce();
    expect(revalidatePath).toHaveBeenCalledWith("/hobbies/albums");
    expect(revalidatePath).toHaveBeenCalledWith("/admin");
  });

  it("returns validation errors without touching the DB", async () => {
    auth.mockResolvedValue({
      user: { email: allowlistedEmail },
      expires: "9999-01-01T00:00:00Z",
    });

    const result = await createAlbum(
      validFormData({ title: "", artist: "Joni" }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Validation failed");
      expect(result.fieldErrors?.title).toBeDefined();
    }
    expect(prisma.album.create).not.toHaveBeenCalled();
  });
});

describe("updateAlbum authorization", () => {
  it("throws when unauthenticated", async () => {
    auth.mockResolvedValue(null);
    await expect(updateAlbum("id-1", validFormData())).rejects.toThrow(
      "Unauthorized",
    );
    expect(prisma.album.update).not.toHaveBeenCalled();
  });

  it("updates when allowlisted", async () => {
    auth.mockResolvedValue({
      user: { email: allowlistedEmail },
      expires: "9999-01-01T00:00:00Z",
    });
    vi.mocked(prisma.album.update).mockResolvedValue({
      id: "id-1",
    } as unknown as Awaited<ReturnType<typeof prisma.album.update>>);

    const result = await updateAlbum("id-1", validFormData());
    expect(result.ok).toBe(true);
    expect(prisma.album.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "id-1" } }),
    );
  });
});

describe("deleteAlbum authorization", () => {
  it("throws when unauthenticated", async () => {
    auth.mockResolvedValue(null);
    await expect(deleteAlbum("id-1")).rejects.toThrow("Unauthorized");
    expect(prisma.album.delete).not.toHaveBeenCalled();
  });

  it("deletes and revalidates when allowlisted", async () => {
    auth.mockResolvedValue({
      user: { email: allowlistedEmail },
      expires: "9999-01-01T00:00:00Z",
    });
    vi.mocked(prisma.album.delete).mockResolvedValue({
      id: "id-1",
    } as unknown as Awaited<ReturnType<typeof prisma.album.delete>>);

    const result = await deleteAlbum("id-1");
    expect(result.ok).toBe(true);
    expect(prisma.album.delete).toHaveBeenCalledWith({ where: { id: "id-1" } });
    expect(revalidatePath).toHaveBeenCalledWith("/hobbies/albums");
  });
});
