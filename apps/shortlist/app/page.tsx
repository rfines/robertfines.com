import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { PLAN_PRICING, type Plan } from "@/lib/plan";

export default async function LandingPage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Navbar */}
      <nav className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-lg font-bold">Retold</span>
          <div className="flex items-center gap-6">
            <a
              href="#features"
              className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors hidden sm:block"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors hidden sm:block"
            >
              Pricing
            </a>
            <Link
              href="/auth/signin"
              className="text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-1.5 bg-[var(--accent)]/10 text-[var(--accent)] text-xs font-semibold px-3 py-1 rounded-full mb-6">
          AI Resume Tailoring
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-6 leading-tight">
          Your Resume,
          <br />
          Retold.
        </h1>
        <p className="text-lg text-[var(--muted)] max-w-xl mx-auto mb-8 leading-relaxed">
          Paste a job description. Get a resume that speaks directly to the role
          — optimized for ATS and ready to send.
        </p>
        <Link
          href="/auth/signin"
          className="inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold px-8 py-3 rounded-lg transition-colors text-sm"
        >
          Get started free
        </Link>
        <p className="mt-3 text-xs text-[var(--muted)]">
          Sign in with Google · No credit card required
        </p>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-bold text-center mb-12">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          {[
            {
              step: "1",
              title: "Upload your resume",
              desc: "PDF, DOCX, or paste plain text. Your base resume is saved for future tailoring sessions.",
            },
            {
              step: "2",
              title: "Paste the job description",
              desc: "Any role, any format. Add custom instructions to guide the AI on Starter and Pro plans.",
            },
            {
              step: "3",
              title: "Copy or download",
              desc: "ATS-optimized and ready to send. Free plan gets plain text copy — paid plans unlock file downloads.",
            },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] font-bold text-sm flex items-center justify-center mb-4 shrink-0">
                {step}
              </div>
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-sm text-[var(--muted)] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-[var(--surface)] border-y border-[var(--border)]">
        <div className="max-w-4xl mx-auto px-6 py-24">
          <h2 className="text-2xl font-bold text-center mb-12">Why Retold</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                title: "Speaks recruiter language",
                desc: "Mirrors the exact keywords and phrases from each job description so your resume clears ATS filters and gets noticed.",
              },
              {
                title: "Multiple variations",
                desc: "Generate up to 3 unique tailoring approaches in one session. Compare them side by side and pick the strongest fit.",
              },
              {
                title: "Export your way",
                desc: "Download as DOCX for easy editing, Markdown for portability, or a styled PDF. Every format recruiters expect.",
              },
            ].map(({ title, desc }) => (
              <div
                key={title}
                className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-6"
              >
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-4xl mx-auto px-6 py-24">
        <h2 className="text-2xl font-bold text-center mb-3">Simple pricing</h2>
        <p className="text-sm text-[var(--muted)] text-center mb-12">
          Start free. Upgrade when you&apos;re ready.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <PricingCard plan="free" />
          <PricingCard plan="starter" featured />
          <PricingCard plan="pro" />
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[var(--border)] bg-[var(--accent)]/5">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to stand out?</h2>
          <p className="text-[var(--muted)] mb-8">
            Start tailoring your resume to every job in minutes.
          </p>
          <Link
            href="/auth/signin"
            className="inline-flex bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold px-8 py-3 rounded-lg transition-colors text-sm"
          >
            Get started free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between">
          <span className="text-sm font-bold">Retold</span>
          <p className="text-xs text-[var(--muted)]">© 2026 Retold. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

const planFeatures: {
  label: string;
  free: boolean | string;
  starter: boolean | string;
  pro: boolean | string;
}[] = [
  { label: "Tailored resume variations", free: "1",   starter: "2",  pro: "3"   },
  { label: "Plain text view + Copy",      free: true,  starter: true, pro: true  },
  { label: "Keyword match score",          free: true,  starter: true, pro: true  },
  { label: "DOCX download",               free: false, starter: true, pro: true  },
  { label: "Markdown export",             free: false, starter: true, pro: true  },
  { label: "Custom tailoring instructions", free: false, starter: true, pro: true },
  { label: "PDF export",                  free: false, starter: false, pro: true },
];

function PricingCard({ plan, featured }: { plan: Plan; featured?: boolean }) {
  const { label, price, period, description } = PLAN_PRICING[plan];

  return (
    <div
      className={`rounded-xl border p-6 flex flex-col ${
        featured
          ? "border-[var(--accent)] shadow-md"
          : "border-[var(--border)] bg-[var(--surface)]"
      }`}
    >
      {featured && (
        <div className="mb-3">
          <span className="text-[10px] font-semibold bg-[var(--accent)]/10 text-[var(--accent)] px-2 py-0.5 rounded-full uppercase tracking-wide">
            Most popular
          </span>
        </div>
      )}

      <div className="mb-5">
        <p className="text-sm font-semibold text-[var(--muted)] mb-1">{label}</p>
        <div className="flex items-baseline gap-0.5">
          <span className="text-3xl font-bold">{price}</span>
          {period && <span className="text-sm text-[var(--muted)]">{period}</span>}
        </div>
        <p className="text-xs text-[var(--muted)] mt-1">{description}</p>
      </div>

      <ul className="space-y-2.5 flex-1 mb-6">
        {planFeatures.map(({ label: feat, [plan]: value }) => {
          const included = value !== false;
          return (
            <li key={feat} className="flex items-start gap-2 text-sm">
              {typeof value === "string" ? (
                <>
                  <Check size={14} className="mt-0.5 text-[var(--accent)] shrink-0" />
                  <span>
                    <span className="font-medium">{value}</span>{" "}
                    {value === "1" ? "tailored variation" : "tailored variations"}
                  </span>
                </>
              ) : included ? (
                <>
                  <Check size={14} className="mt-0.5 text-[var(--accent)] shrink-0" />
                  <span>{feat}</span>
                </>
              ) : (
                <>
                  <X size={14} className="mt-0.5 text-[var(--border)] shrink-0" />
                  <span className="text-[var(--muted)]">{feat}</span>
                </>
              )}
            </li>
          );
        })}
      </ul>

      <Link
        href="/auth/signin"
        className={`text-center text-sm font-semibold py-2.5 rounded-lg transition-colors ${
          featured
            ? "bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white"
            : "border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] text-[var(--foreground)]"
        }`}
      >
        {plan === "free" ? "Get started free" : `Get ${label}`}
      </Link>
    </div>
  );
}
