"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  LayoutDashboard,
  FileText,
  Sparkles,
  Wrench,
  CreditCard,
  MessageSquare,
} from "lucide-react";
import { useFeedback } from "@/components/shared/feedback-modal";

const items = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/resumes", label: "Resumes", icon: FileText },
  { href: "/dashboard/tailored", label: "Tailored", icon: Sparkles },
  { href: "/dashboard/tools", label: "Tools", icon: Wrench },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
];

export function MobileNav() {
  const pathname = usePathname();
  const { openFeedback } = useFeedback();

  return (
    <>
      {/* Feedback FAB */}
      <button
        onClick={openFeedback}
        aria-label="Send feedback"
        className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom)+0.75rem)] right-4 z-50 lg:hidden
                   w-10 h-10 rounded-full bg-surface border border-border shadow-[var(--shadow-lg)]
                   flex items-center justify-center text-muted hover:text-accent transition-colors"
      >
        <MessageSquare size={18} />
      </button>

      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-surface border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14">
        {items.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] transition-colors",
                isActive ? "text-accent" : "text-muted"
              )}
            >
              <Icon size={20} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
    </>
  );
}
