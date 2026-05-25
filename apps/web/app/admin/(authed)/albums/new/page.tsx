import { redirect } from "next/navigation";
import { createAlbum, type MutationResult } from "@/lib/albums";
import { AlbumForm } from "../../_components/album-form";

async function createAction(
  _state: MutationResult | null,
  formData: FormData,
): Promise<MutationResult> {
  "use server";
  const result = await createAlbum(formData);
  if (result.ok) redirect("/admin");
  return result;
}

export default function NewAlbumPage() {
  return (
    <>
      <div>
        <p className="text-[var(--muted)] text-sm mb-2">$ touch album.md</p>
        <h1 className="text-2xl font-bold text-[var(--accent)]">## new album</h1>
      </div>
      <AlbumForm action={createAction} submitLabel="create" />
    </>
  );
}
