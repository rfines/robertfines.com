export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16 space-y-10">
      <div>
        <p className="text-[var(--muted)] text-sm mb-2">$ whoami --contact</p>
        <h1 className="text-2xl font-bold text-[var(--accent)]">## contact</h1>
      </div>

      <div className="space-y-4 text-sm">
        <div className="space-y-1">
          <p className="text-[var(--muted)]">$ echo $EMAIL</p>
          <a
            href="mailto:fines.robert@gmail.com"
            className="text-[var(--foreground)] hover:text-[var(--accent)] transition-colors pl-4"
          >
            fines.robert@gmail.com
          </a>
        </div>

        <div className="space-y-1">
          <p className="text-[var(--muted)]">$ echo $PHONE</p>
          <div className="pl-4 space-y-0.5">
            <a
              href="tel:+18165474271"
              className="text-[var(--foreground)] hover:text-[var(--accent)] transition-colors block"
            >
              (816) 547-4271
            </a>
            <p className="text-[var(--muted)] text-xs">Spam is relentless — a message goes a long way.</p>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-[var(--muted)]">$ open $LINKEDIN</p>
          <a
            href="https://linkedin.com/in/robertfines"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--foreground)] hover:text-[var(--accent)] transition-colors pl-4"
          >
            linkedin.com/in/robertfines
          </a>
        </div>

        <div className="space-y-1">
          <p className="text-[var(--muted)]">$ open $GITHUB</p>
          <a
            href="https://github.com/rfines"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--foreground)] hover:text-[var(--accent)] transition-colors pl-4"
          >
            github.com/rfines
          </a>
        </div>
      </div>
    </div>
  );
}
