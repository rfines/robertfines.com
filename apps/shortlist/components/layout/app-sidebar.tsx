"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { FileText, Sparkles, LayoutDashboard, CreditCard, Pencil, Linkedin } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/resumes", label: "My Resumes", icon: FileText },
  { href: "/dashboard/tailored", label: "Tailored Versions", icon: Sparkles },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
];

const toolItems = [
  { href: "/dashboard/tools/bullet-rewriter", label: "Bullet Rewriter", icon: Pencil },
  { href: "/dashboard/tools/linkedin", label: "LinkedIn Optimizer", icon: Linkedin },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-[var(--border)] flex flex-col min-h-screen">
      <div className="p-5 border-b border-[var(--border)]">
        <Link href="/dashboard" className="text-lg font-bold text-[var(--foreground)]">
          Retold
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)]"
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}

        <div className="pt-4 pb-1 px-3">
          <p className="text-[10px] font-semibold text-[var(--muted)] uppercase tracking-widest">
            Tools
          </p>
        </div>

        {toolItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)]"
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
