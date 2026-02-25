import { auth, signOut } from "@/lib/auth";
import Image from "next/image";

export async function Header() {
  const session = await auth();

  return (
    <header className="h-14 border-b border-[var(--border)] flex items-center justify-end px-6 gap-4 shrink-0">
      {session?.user && (
        <div className="flex items-center gap-3">
          {session.user.image && (
            <Image
              src={session.user.image}
              alt={session.user.name ?? "User"}
              width={28}
              height={28}
              className="rounded-full"
            />
          )}
          <span className="text-sm text-[var(--muted)]">
            {session.user.name ?? session.user.email}
          </span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      )}
    </header>
  );
}
