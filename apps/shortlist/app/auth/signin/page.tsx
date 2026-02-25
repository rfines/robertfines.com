import { auth, signIn } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;

  if (session) {
    redirect(params.callbackUrl ?? "/dashboard");
  }

  const callbackUrl = params.callbackUrl ?? "/dashboard";

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-sm w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Welcome to Shortlist
          </h1>
          <p className="text-sm text-[var(--muted)]">
            Sign in with Google to continue
          </p>
        </div>

        {params.error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-sm text-red-400 text-center">
            {params.error === "AccessDenied"
              ? "Access denied. Contact the administrator to request access."
              : "Something went wrong. Please try again."}
          </div>
        )}

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 space-y-4">
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: callbackUrl });
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-900 font-medium px-4 py-3 rounded-lg transition-colors text-sm"
            >
              <GoogleIcon />
              Continue with Google
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[var(--muted)]">
          Access is limited to invited users.
        </p>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}
