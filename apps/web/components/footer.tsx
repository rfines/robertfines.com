export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-[var(--border)] px-6 py-4 text-sm text-[var(--muted)]">
      © {year} Robert Fines
      <span className="cursor-blink ml-0.5">_</span>
    </footer>
  );
}
