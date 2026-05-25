import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";
import { isAllowed, parseAllowlist } from "@/lib/auth-allowlist";

async function signInWithGoogle() {
  "use server";
  await signIn("google", { redirectTo: "/admin" });
}

export default async function SignInPage() {
  const session = await auth();
  const allowlist = parseAllowlist(process.env.ADMIN_EMAILS);

  if (isAllowed(session?.user?.email, allowlist)) {
    redirect("/admin");
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-16 space-y-10">
      <div>
        <p className="text-[var(--muted)] text-sm mb-2">$ login</p>
        <h1 className="text-2xl font-bold text-[var(--accent)]">## admin / signin</h1>
      </div>

      <p className="text-[var(--muted)] text-sm max-w-xl">
        Restricted area. Sign in with an allowlisted Google account to manage
        the album collection.
      </p>

      <form action={signInWithGoogle}>
        <button
          type="submit"
          className="text-sm border border-[var(--border)] text-[var(--foreground)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors px-4 py-2 rounded"
        >
          $ sign in with Google
        </button>
      </form>
    </div>
  );
}
