import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function LandingPage() {
  const session = await auth();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-lg w-full text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-[var(--foreground)] tracking-tight">
            Shortlist
          </h1>
          <p className="text-lg text-[var(--muted)] leading-relaxed">
            AI-powered resume tailoring. Paste a job description, get a resume
            that speaks directly to the role.
          </p>
        </div>

        <div className="flex flex-col items-center gap-3">
          <Link
            href="/auth/signin"
            className="inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold px-8 py-3 rounded-lg transition-colors text-sm"
          >
            Get Started
          </Link>
          <p className="text-xs text-[var(--muted)]">Sign in with Google</p>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4">
          {[
            { label: "Paste resume", desc: "Or upload PDF / DOCX" },
            { label: "Add job description", desc: "Any role, any format" },
            { label: "Download tailored version", desc: "Optimized for ATS" },
          ].map(({ label, desc }) => (
            <div
              key={label}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4 text-left space-y-1"
            >
              <p className="text-sm font-medium text-[var(--foreground)]">
                {label}
              </p>
              <p className="text-xs text-[var(--muted)]">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
