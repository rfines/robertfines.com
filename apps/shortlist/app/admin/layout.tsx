import { requireAdmin } from "@/lib/admin";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="h-14 border-b border-[var(--border)] flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <ShieldCheck size={18} className="text-[var(--accent)]" />
          <span className="text-sm font-semibold text-[var(--foreground)]">
            Admin Panel
          </span>
          <Badge variant="muted">Admin</Badge>
        </div>
        <nav className="flex items-center gap-6 text-xs text-[var(--muted)]">
          <Link href="/admin" className="hover:text-[var(--foreground)] transition-colors">
            Stats
          </Link>
          <Link href="/admin/users" className="hover:text-[var(--foreground)] transition-colors">
            Users
          </Link>
          <Link href="/dashboard" className="hover:text-[var(--foreground)] transition-colors">
            ← Dashboard
          </Link>
        </nav>
      </header>
      <main className="p-8 max-w-5xl mx-auto">{children}</main>
    </div>
  );
}
