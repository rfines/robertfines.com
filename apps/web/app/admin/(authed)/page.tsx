import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { listAlbums, deleteAlbum } from "@/lib/albums";
import { DeleteButton } from "./_components/delete-button";

async function signOutAction() {
  "use server";
  await signOut({ redirectTo: "/admin/signin" });
}

async function deleteAlbumAction(id: string) {
  "use server";
  return deleteAlbum(id);
}

export default async function AdminDashboard() {
  const session = await auth();
  const email = session?.user?.email ?? "";
  const albums = await listAlbums();

  return (
    <>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[var(--muted)] text-sm mb-2">$ whoami</p>
          <h1 className="text-2xl font-bold text-[var(--accent)]">## admin</h1>
          <p className="text-[var(--muted)] text-sm mt-1">
            signed in as <span className="text-[var(--accent)]">{email}</span>
          </p>
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            className="text-xs border border-[var(--border)] text-[var(--muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors px-3 py-1.5 rounded"
          >
            $ sign out
          </button>
        </form>
      </div>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between border-b border-[var(--border)] pb-2">
          <h2 className="text-[var(--accent)] text-sm font-semibold uppercase tracking-widest">
            ### albums ({albums.length})
          </h2>
          <Link
            href="/admin/albums/new"
            className="text-xs text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
          >
            + new album
          </Link>
        </div>

        {albums.length === 0 ? (
          <p className="text-[var(--muted)] text-sm">
            &gt; no albums yet. <Link href="/admin/albums/new" className="hover:text-[var(--accent)]">create the first one</Link>.
          </p>
        ) : (
          <ul className="space-y-3">
            {albums.map((album) => (
              <li
                key={album.id}
                className="flex items-baseline gap-2 flex-wrap border border-[var(--border)] rounded px-3 py-2"
              >
                <span className="text-[var(--muted)]">&gt;</span>
                <Link
                  href={`/admin/albums/${album.id}`}
                  className="text-[var(--foreground)] font-medium hover:text-[var(--accent)] transition-colors"
                >
                  {album.title}
                </Link>
                <span className="text-[var(--muted)] text-sm">— {album.artist}</span>
                <span className="text-[var(--muted)] text-xs ml-auto">{album.format}</span>
                <DeleteButton
                  albumId={album.id}
                  albumLabel={`${album.title} — ${album.artist}`}
                  action={deleteAlbumAction}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
