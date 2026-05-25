import { auth, signOut } from "@/lib/auth";

async function signOutAction() {
  "use server";
  await signOut({ redirectTo: "/admin/signin" });
}

export default async function AdminDashboard() {
  const session = await auth();
  const email = session?.user?.email ?? "";

  return (
    <>
      <div>
        <p className="text-[var(--muted)] text-sm mb-2">$ whoami</p>
        <h1 className="text-2xl font-bold text-[var(--accent)]">## admin</h1>
      </div>

      <p className="text-[var(--foreground)] text-sm">
        signed in as <span className="text-[var(--accent)]">{email}</span>
      </p>

      <p className="text-[var(--muted)] text-sm">
        &gt; album CRUD lands in the next phase.
      </p>

      <form action={signOutAction}>
        <button
          type="submit"
          className="text-xs border border-[var(--border)] text-[var(--muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors px-3 py-1.5 rounded"
        >
          $ sign out
        </button>
      </form>
    </>
  );
}
