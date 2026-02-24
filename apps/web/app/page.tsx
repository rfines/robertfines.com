import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center px-6 py-16 max-w-3xl mx-auto">
      <div className="space-y-8">
        <div className="space-y-2">
          <p className="text-[var(--muted)] text-sm">$ whoami</p>
          <h1 className="text-4xl font-bold tracking-tight text-[var(--foreground)]">
            Robert Fines
          </h1>
          <p className="text-[var(--accent)] text-lg">
            &gt; Senior Software Engineer
            <span className="cursor-blink ml-1">_</span>
          </p>
        </div>

        <div className="space-y-4 text-[var(--muted)] leading-relaxed max-w-xl">
          <p>
            15 years building web software across the full spectrum — from
            pre-revenue startups where I held every technical role the moment
            required, to a global enterprise handling millions of daily
            requests. That range is intentional. I know what it takes to move
            fast early and what it takes to stay reliable at scale.
          </p>
          <p>
            I operate with low ego and high ownership. The best idea wins
            regardless of where it comes from. At this point in my career I
            care more about moving the right thing forward than being the one
            who moved it — and I&apos;ve found that makes teams faster, not
            slower.
          </p>
        </div>

        <div className="space-y-2 text-sm">
          <Link
            href="/resume"
            className="flex items-center gap-2 text-[var(--muted)] hover:text-[var(--accent)] transition-colors group"
          >
            <span className="text-[var(--border)] group-hover:text-[var(--accent)]">$</span>
            <span>cd /resume</span>
          </Link>
          <Link
            href="/blog"
            className="flex items-center gap-2 text-[var(--muted)] hover:text-[var(--accent)] transition-colors group"
          >
            <span className="text-[var(--border)] group-hover:text-[var(--accent)]">$</span>
            <span>cd /blog</span>
          </Link>
          <Link
            href="/contact"
            className="flex items-center gap-2 text-[var(--muted)] hover:text-[var(--accent)] transition-colors group"
          >
            <span className="text-[var(--border)] group-hover:text-[var(--accent)]">$</span>
            <span>cd /contact</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
