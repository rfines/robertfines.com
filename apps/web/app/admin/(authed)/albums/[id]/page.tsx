import { notFound, redirect } from "next/navigation";
import { getAlbum, updateAlbum, type MutationResult } from "@/lib/albums";
import { AlbumForm } from "../../_components/album-form";

export default async function EditAlbumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const album = await getAlbum(id);
  if (!album) notFound();

  async function updateAction(
    _state: MutationResult | null,
    formData: FormData,
  ): Promise<MutationResult> {
    "use server";
    const result = await updateAlbum(id, formData);
    if (result.ok) redirect("/admin");
    return result;
  }

  return (
    <>
      <div>
        <p className="text-[var(--muted)] text-sm mb-2">$ vi album.md</p>
        <h1 className="text-2xl font-bold text-[var(--accent)]">## edit album</h1>
        <p className="text-[var(--muted)] text-sm mt-1">
          {album.title} — {album.artist}
        </p>
      </div>
      <AlbumForm initial={album} action={updateAction} submitLabel="save" />
    </>
  );
}
