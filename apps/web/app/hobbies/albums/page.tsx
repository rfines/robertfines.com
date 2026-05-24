import Link from "next/link";
import { AlbumsList } from "./_components/albums-list";
import { listAlbums } from "@/lib/albums";

export const dynamic = "force-dynamic";

export default async function AlbumsPage() {
  const albums = await listAlbums();

  return (
    <div className="max-w-3xl mx-auto px-6 py-16 space-y-10">
      <div>
        <p className="text-[var(--muted)] text-sm mb-2">$ ls ./hobbies/albums</p>
        <h1 className="text-2xl font-bold text-[var(--accent)]">## music / albums</h1>
      </div>

      <p className="text-[var(--muted)] text-sm">
        <Link
          href="/hobbies"
          className="hover:text-[var(--accent)] transition-colors"
        >
          ../hobbies
        </Link>
      </p>

      <AlbumsList albums={albums} />
    </div>
  );
}
