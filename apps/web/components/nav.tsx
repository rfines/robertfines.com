"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "~/" },
  { href: "/resume", label: "~/resume" },
  { href: "/blog", label: "~/blog" },
  { href: "/contact", label: "~/contact" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-[var(--border)] px-6 py-4">
      <ul className="flex gap-6 text-sm">
        {links.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                className={`transition-colors ${
                  active
                    ? "text-[var(--accent)]"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {active && <span className="mr-1">&gt;</span>}
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
