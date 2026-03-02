"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

const LABEL_MAP: Record<string, string> = {
  dashboard: "Dashboard",
  resumes: "Resumes",
  tailored: "Tailored",
  billing: "Billing",
  tools: "Tools",
  "bullet-rewriter": "Bullet Rewriter",
  linkedin: "LinkedIn Optimizer",
  admin: "Admin",
  "keyword-noise": "Keyword Noise",
  users: "Users",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // Don't show breadcrumbs on the dashboard root
  if (segments.length <= 1) return null;

  const crumbs = segments.map((segment, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/");
    const label = LABEL_MAP[segment] || segment;
    const isLast = i === segments.length - 1;
    // Skip UUID-like segments in breadcrumb labels
    const isId = /^[0-9a-f-]{20,}$/i.test(segment);

    return { href, label: isId ? "Detail" : label, isLast };
  });

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
      {crumbs.map(({ href, label, isLast }, i) => (
        <span key={href} className="flex items-center gap-1">
          {i > 0 && <ChevronRight size={12} className="text-muted" />}
          {isLast ? (
            <span className="text-foreground font-medium">{label}</span>
          ) : (
            <Link
              href={href}
              className="text-muted hover:text-foreground transition-colors"
            >
              {label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
