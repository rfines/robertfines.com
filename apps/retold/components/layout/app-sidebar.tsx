"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { useSidebar } from "@/components/layout/sidebar-context";
import {
  FileText,
  Sparkles,
  LayoutDashboard,
  CreditCard,
  Pencil,
  Linkedin,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

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
  const { collapsed, toggle } = useSidebar();

  return (
    <aside
      className={cn(
        "hidden lg:flex shrink-0 border-r border-border flex-col min-h-screen bg-surface transition-all duration-200",
        collapsed ? "w-[60px]" : "w-[240px]"
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "border-b border-border flex items-center",
          collapsed ? "justify-center h-14" : "px-5 h-14"
        )}
      >
        <Link
          href="/dashboard"
          className="text-lg font-bold text-foreground"
        >
          {collapsed ? "R" : "Retold"}
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-2 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg text-sm transition-colors",
                collapsed ? "justify-center px-2 py-2" : "px-3 py-2",
                isActive
                  ? "bg-accent/10 text-accent"
                  : "text-muted hover:text-foreground hover:bg-background"
              )}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}

        {/* Tools section */}
        {!collapsed && (
          <div className="pt-4 pb-1 px-3">
            <p className="text-[10px] font-semibold text-muted uppercase tracking-widest">
              Tools
            </p>
          </div>
        )}
        {collapsed && <div className="my-2 mx-2 border-t border-border" />}

        {toolItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg text-sm transition-colors",
                collapsed ? "justify-center px-2 py-2" : "px-3 py-2",
                isActive
                  ? "bg-accent/10 text-accent"
                  : "text-muted hover:text-foreground hover:bg-background"
              )}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-border p-2">
        <button
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "flex items-center gap-3 rounded-lg text-sm text-muted hover:text-foreground hover:bg-background transition-colors w-full",
            collapsed ? "justify-center px-2 py-2" : "px-3 py-2"
          )}
        >
          {collapsed ? (
            <ChevronsRight size={18} />
          ) : (
            <>
              <ChevronsLeft size={18} className="shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
