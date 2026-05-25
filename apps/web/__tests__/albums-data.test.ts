import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    album: {
      findMany: vi.fn(),
    },
  },
}));

import { listAlbums } from "@/lib/albums";
import { prisma } from "@/lib/prisma";

describe("listAlbums", () => {
  beforeEach(() => {
    vi.mocked(prisma.album.findMany).mockReset();
  });

  it("queries prisma.album.findMany ordered by artist then title", async () => {
    const fixture = [
      { id: "1", title: "Blue", artist: "Joni Mitchell" },
    ];
    vi.mocked(prisma.album.findMany).mockResolvedValue(
      fixture as unknown as Awaited<ReturnType<typeof prisma.album.findMany>>,
    );

    const result = await listAlbums();

    expect(prisma.album.findMany).toHaveBeenCalledWith({
      orderBy: [{ artist: "asc" }, { title: "asc" }],
    });
    expect(result).toEqual(fixture);
  });
});
