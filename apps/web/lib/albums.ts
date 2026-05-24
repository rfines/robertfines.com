import type { Album } from "@prisma/client";
import { prisma } from "./prisma";

export type { Album };

export async function listAlbums(): Promise<Album[]> {
  return prisma.album.findMany({
    orderBy: [{ artist: "asc" }, { title: "asc" }],
  });
}
