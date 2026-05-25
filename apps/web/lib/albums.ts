import "server-only";
import { revalidatePath } from "next/cache";
import type { Album } from "@prisma/client";
import { prisma } from "./prisma";
import { auth } from "./auth";
import { isAllowed, parseAllowlist } from "./auth-allowlist";
import { albumInputSchema } from "./album-schema";

export type { Album };

async function assertAdmin() {
  const session = await auth();
  const allowlist = parseAllowlist(process.env.ADMIN_EMAILS);
  if (!isAllowed(session?.user?.email, allowlist)) {
    throw new Error("Unauthorized");
  }
}

function revalidateAlbumPaths() {
  revalidatePath("/hobbies/albums");
  revalidatePath("/admin");
}

export async function listAlbums(): Promise<Album[]> {
  return prisma.album.findMany({
    orderBy: [{ artist: "asc" }, { title: "asc" }],
  });
}

export async function getAlbum(id: string): Promise<Album | null> {
  return prisma.album.findUnique({ where: { id } });
}

export type MutationResult =
  | { ok: true; album: Album }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export type DeleteResult = { ok: true } | { ok: false; error: string };

function parseFormData(formData: FormData) {
  return albumInputSchema.safeParse({
    title: formData.get("title") ?? "",
    artist: formData.get("artist") ?? "",
    year: formData.get("year") ?? "",
    genre: formData.get("genre") ?? "",
    format: formData.get("format") ?? "",
    label: formData.get("label") ?? "",
    coverImageUrl: formData.get("coverImageUrl") ?? "",
    rating: formData.get("rating") ?? "",
    notes: formData.get("notes") ?? "",
  });
}

export async function createAlbum(formData: FormData): Promise<MutationResult> {
  await assertAdmin();

  const parsed = parseFormData(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const album = await prisma.album.create({ data: parsed.data });
  revalidateAlbumPaths();
  return { ok: true, album };
}

export async function updateAlbum(
  id: string,
  formData: FormData,
): Promise<MutationResult> {
  await assertAdmin();

  const parsed = parseFormData(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const album = await prisma.album.update({ where: { id }, data: parsed.data });
  revalidateAlbumPaths();
  return { ok: true, album };
}

export async function deleteAlbum(id: string): Promise<DeleteResult> {
  await assertAdmin();
  await prisma.album.delete({ where: { id } });
  revalidateAlbumPaths();
  return { ok: true };
}
