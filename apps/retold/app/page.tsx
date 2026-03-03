import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Check,
  X,
  Sparkles,
  Target,
  FileDown,
  Zap,
  Shield,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { PLAN_PRICING, type Plan } from "@/lib/plan";
import { PLAN_FEATURES } from "@/lib/plan-features";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { RevealOnScroll } from "@/components/shared/reveal-on-scroll";
import { WaitlistForm } from "@/components/shared/waitlist-form";

const softwareApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Retold",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://retold.dev",
  description:
    "AI-powered resume tailoring. Upload your resume, paste a job description, and get a tailored version in 30 seconds with keyword matching and ATS analysis.",
  offers: [
    {
      "@type": "Offer",
      name: "Free",
      price: "0",
      priceCurrency: "USD",
      description:
        "1 tailored variation, plain text copy, keyword match score",
    },
    {
      "@type": "Offer",
      name: "Starter",
      price: "9.99",
      priceCurrency: "USD",
      description: "2 variations, DOCX + Markdown export, custom instructions",
    },
    {
      "@type": "Offer",
      name: "Pro",
      price: "19.99",
      priceCurrency: "USD",
      description:
        "3 variations, unlimited runs, all exports including PDF",
    },
    {
      "@type": "Offer",
      name: "Agency",
      price: "49.99",
      priceCurrency: "USD",
      description:
        "5 variations, unlimited runs, candidate name labeling — for recruiters and staffing agencies",
    },
  ],
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Retold?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Retold is an AI-powered resume tailoring tool. You upload your resume once, paste a job description, and in about 30 seconds you get a version restructured specifically for that role — with keyword match scoring and ATS analysis built in.",
      },
    },
    {
      "@type": "Question",
      name: "How does AI resume tailoring work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Retold uses Claude (Anthropic's AI) to analyze the job description, extract key requirements and keywords, then restructure and rewrite your resume to match — emphasizing the most relevant experience and using language that mirrors the role.",
      },
    },
    {
      "@type": "Question",
      name: "Will my resume still sound like me?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Retold rewrites your story, not your identity. It works from your actual experience and preserves your voice — it reorders sections, adjusts emphasis, and mirrors the job's language without fabricating anything.",
      },
    },
    {
      "@type": "Question",
      name: "What does ATS-optimized mean?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Applicant Tracking Systems (ATS) are software used by employers to filter resumes before a human sees them. Retold formats your resume to pass ATS filters by using plain text, standard section headers, and the exact keywords from the job description.",
      },
    },
    {
      "@type": "Question",
      name: "Is Retold free to use?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. The free plan lets you tailor one resume variation and copy the result. Paid plans ($9.99–$19.99/month) unlock multiple variations, file downloads (DOCX, Markdown, PDF), and custom tailoring instructions.",
      },
    },
  ],
};

const STEPS = [
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
    desc: "ATS-optimized and ready to send. Free plan gets plain text — paid plans unlock file downloads.",
  },
];

const FEATURES = [
  {
    icon: Target,
    title: "Keyword-matched",
    desc: "Mirrors the exact phrases from each job description so your resume clears ATS filters and speaks directly to the hiring manager.",
  },
  {
    icon: Sparkles,
    title: "Multiple variations",
    desc: "Generate up to 5 unique tailoring approaches in one session. Compare side by side and pick the strongest fit.",
  },
  {
    icon: FileDown,
    title: "Export your way",
    desc: "Download as DOCX, Markdown, or styled PDF. Every format recruiters expect, ready in one click.",
  },
  {
    icon: Zap,
    title: "30-second turnaround",
    desc: "Powered by Claude — Anthropic's most capable AI. Your tailored resume is ready before you finish your coffee.",
  },
  {
    icon: Shield,
    title: "ATS-optimized output",
    desc: "Standard section headers, clean formatting, and zero tables or graphics. Built to pass every tracking system.",
  },
  {
    icon: BarChart3,
    title: "Match score + gap analysis",
    desc: "See exactly how your resume stacks up with keyword scoring, gap analysis, and actionable improvement suggestions.",
  },
];

export default async function LandingPage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareApplicationJsonLd),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Navbar */}
      <nav className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-lg font-bold">Retold</span>
          <div className="flex items-center gap-4">
            <a
              href="#features"
              className="text-sm text-muted hover:text-foreground transition-colors hidden sm:block"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="text-sm text-muted hover:text-foreground transition-colors hidden sm:block"
            >
              Pricing
            </a>
            <a
              href="#waitlist"
              className="text-sm text-muted hover:text-foreground transition-colors hidden sm:block"
            >
              Join waitlist
            </a>
            <ThemeToggle />
            <Link
              href="/auth/signin"
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/auth/signin"
              className="hidden sm:inline-flex items-center gap-1.5 bg-accent hover:bg-accent-hover hover:shadow-[var(--accent-glow)] text-white font-semibold px-4 py-1.5 rounded-lg transition-all text-sm"
            >
              Get Started
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-accent/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-6 pt-28 pb-24 text-center">
          <RevealOnScroll>
            <div className="inline-flex items-center gap-1.5 bg-accent/10 text-accent text-xs font-semibold px-3 py-1 rounded-full mb-8 border border-accent/20">
              <Sparkles size={12} />
              AI-Powered Resume Tailoring
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={0.1}>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
              Your Resume,
              <br />
              <span className="text-accent">Retold.</span>
            </h1>
          </RevealOnScroll>

          <RevealOnScroll delay={0.2}>
            <p className="text-lg sm:text-xl text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
              Paste a job description. Get a resume that speaks directly to the
              role — keyword-matched, ATS-optimized, and ready to send in 30
              seconds.
            </p>
          </RevealOnScroll>

          <RevealOnScroll delay={0.3}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/signin"
                className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover hover:shadow-[var(--accent-glow)] text-white font-semibold px-8 py-3.5 rounded-lg transition-all text-sm"
              >
                Get started free
                <ArrowRight size={16} />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
              >
                See how it works
              </a>
            </div>
            <p className="mt-4 text-xs text-muted">
              Sign in with Google, GitHub, or LinkedIn · No credit card required
            </p>
          </RevealOnScroll>
        </div>
      </section>

      {/* Social proof */}
      <RevealOnScroll>
        <section className="border-y border-border bg-surface/50">
          <div className="max-w-4xl mx-auto px-6 py-8 text-center">
            <p className="text-xs text-muted uppercase tracking-widest font-medium">
              Trusted by job seekers tailoring resumes for roles at
            </p>
            <div className="flex items-center justify-center gap-8 sm:gap-12 mt-4 text-muted opacity-60">
              {["Google", "Amazon", "Meta", "Microsoft", "Apple"].map(
                (name) => (
                  <span
                    key={name}
                    className="text-sm font-semibold tracking-wide"
                  >
                    {name}
                  </span>
                )
              )}
            </div>
          </div>
        </section>
      </RevealOnScroll>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-6 py-24">
        <RevealOnScroll>
          <h2 className="text-3xl font-bold text-center mb-4">
            Three steps to a better resume
          </h2>
          <p className="text-muted text-center mb-16 max-w-lg mx-auto">
            No templates. No guesswork. Just your experience, restructured for
            the role you want.
          </p>
        </RevealOnScroll>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          {STEPS.map(({ step, title, desc }, i) => (
            <RevealOnScroll key={step} delay={i * 0.1}>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-accent/10 text-accent font-bold text-base flex items-center justify-center mb-5 border border-accent/20">
                  {step}
                </div>
                <h3 className="font-semibold text-lg mb-2">{title}</h3>
                <p className="text-sm text-muted leading-relaxed">{desc}</p>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-surface border-y border-border">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <RevealOnScroll>
            <h2 className="text-3xl font-bold text-center mb-4">
              Why Retold
            </h2>
            <p className="text-muted text-center mb-16 max-w-lg mx-auto">
              Every feature is built to get you past the ATS and in front of a
              human.
            </p>
          </RevealOnScroll>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }, i) => (
              <RevealOnScroll key={title} delay={i * 0.05}>
                <div className="bg-background border border-border rounded-xl p-6 hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 transition-all">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                    <Icon size={20} className="text-accent" />
                  </div>
                  <h3 className="font-semibold mb-2">{title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{desc}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-5xl mx-auto px-6 py-24">
        <RevealOnScroll>
          <h2 className="text-3xl font-bold text-center mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-muted text-center mb-16 max-w-lg mx-auto">
            Start free. Upgrade when you&apos;re ready for more power.
          </p>
        </RevealOnScroll>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <RevealOnScroll delay={0}>
            <PricingCard plan="free" />
          </RevealOnScroll>
          <RevealOnScroll delay={0.05}>
            <PricingCard plan="starter" featured />
          </RevealOnScroll>
          <RevealOnScroll delay={0.1}>
            <PricingCard plan="pro" />
          </RevealOnScroll>
          <RevealOnScroll delay={0.15}>
            <PricingCard plan="agency" />
          </RevealOnScroll>
        </div>
      </section>

      {/* Waitlist / Early Access */}
      <RevealOnScroll>
        <section id="waitlist" className="border-t border-border">
          <div className="max-w-lg mx-auto px-6 py-24 text-center">
            <h2 className="text-3xl font-bold mb-4">Get early access</h2>
            <p className="text-muted mb-8">
              Retold is currently in private beta. Drop your email and
              we&apos;ll let you know when spots open up.
            </p>
            <WaitlistForm source="landing" />
          </div>
        </section>
      </RevealOnScroll>

      {/* CTA */}
      <RevealOnScroll>
        <section className="border-t border-border relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="relative max-w-4xl mx-auto px-6 py-24 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to stand out?
            </h2>
            <p className="text-lg text-muted mb-10 max-w-md mx-auto">
              Stop sending the same resume to every job. Start tailoring in
              minutes.
            </p>
            <Link
              href="/auth/signin"
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover hover:shadow-[var(--accent-glow)] text-white font-semibold px-8 py-3.5 rounded-lg transition-all text-sm"
            >
              Get started free
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </RevealOnScroll>

      {/* Footer */}
      <footer className="border-t border-border bg-surface">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="col-span-2 sm:col-span-1">
              <span className="text-lg font-bold">Retold</span>
              <p className="text-xs text-muted mt-2 leading-relaxed">
                AI-powered resume tailoring. Your story, told for every role.
              </p>
            </div>

            {/* Product */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">
                Product
              </p>
              <div className="space-y-2">
                <a
                  href="#features"
                  className="block text-sm text-muted hover:text-foreground transition-colors"
                >
                  Features
                </a>
                <a
                  href="#pricing"
                  className="block text-sm text-muted hover:text-foreground transition-colors"
                >
                  Pricing
                </a>
                <Link
                  href="/auth/signin"
                  className="block text-sm text-muted hover:text-foreground transition-colors"
                >
                  Sign in
                </Link>
              </div>
            </div>

            {/* Legal */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">
                Legal
              </p>
              <div className="space-y-2">
                <Link
                  href="/privacy"
                  className="block text-sm text-muted hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </Link>
              </div>
            </div>

            {/* Social */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">
                Connect
              </p>
              <div className="space-y-2">
                <a
                  href="https://github.com/rfines"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-muted hover:text-foreground transition-colors"
                >
                  GitHub
                </a>
                <a
                  href="https://linkedin.com/in/robertfines"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-muted hover:text-foreground transition-colors"
                >
                  LinkedIn
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-muted">
              &copy; {new Date().getFullYear()} Retold. All rights reserved.
            </p>
            <p className="text-xs text-muted">
              Made with care in the USA
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function PricingCard({
  plan,
  featured,
}: {
  plan: Plan;
  featured?: boolean;
}) {
  const { label, price, period, description } = PLAN_PRICING[plan];

  return (
    <div
      className={`rounded-xl border p-6 flex flex-col h-full ${
        featured
          ? "border-accent shadow-[var(--accent-glow)] bg-accent/5"
          : "border-border bg-surface hover:shadow-[var(--shadow-md)] transition-shadow"
      }`}
    >
      {featured && (
        <div className="mb-3">
          <span className="text-[10px] font-semibold bg-accent/10 text-accent px-2.5 py-1 rounded-full uppercase tracking-wide border border-accent/20">
            Most popular
          </span>
        </div>
      )}

      <div className="mb-5">
        <p className="text-sm font-semibold text-muted mb-1">{label}</p>
        <div className="flex items-baseline gap-0.5">
          <span className="text-3xl font-bold">{price}</span>
          {period && <span className="text-sm text-muted">{period}</span>}
        </div>
        <p className="text-xs text-muted mt-1">{description}</p>
      </div>

      <ul className="space-y-2.5 flex-1 mb-6">
        {PLAN_FEATURES.map(({ label: feat, [plan]: value }) => {
          const included = value !== false;
          return (
            <li key={feat} className="flex items-start gap-2 text-sm">
              {typeof value === "string" ? (
                <>
                  <Check size={14} className="mt-0.5 text-accent shrink-0" />
                  <span>
                    <span className="font-medium">{value}</span>{" "}
                    {feat.toLowerCase()}
                  </span>
                </>
              ) : included ? (
                <>
                  <Check size={14} className="mt-0.5 text-accent shrink-0" />
                  <span>{feat}</span>
                </>
              ) : (
                <>
                  <X size={14} className="mt-0.5 text-border shrink-0" />
                  <span className="text-muted">{feat}</span>
                </>
              )}
            </li>
          );
        })}
      </ul>

      <Link
        href="/auth/signin"
        className={`text-center text-sm font-semibold py-2.5 rounded-lg transition-all ${
          featured
            ? "bg-accent hover:bg-accent-hover hover:shadow-[var(--accent-glow)] text-white"
            : "border border-border hover:border-accent hover:text-accent text-foreground"
        }`}
      >
        {plan === "free" ? "Get started free" : `Get ${label}`}
      </Link>
    </div>
  );
}
