"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { CreditCard, LogOut } from "lucide-react";

interface UserMenuProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  plan?: string;
  signOutAction: () => Promise<void>;
}

export function UserMenu({ user, plan, signOutAction }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-background transition-colors"
        aria-label="User menu"
      >
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name ?? "User"}
            width={28}
            height={28}
            className="rounded-full"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-accent/15 flex items-center justify-center text-accent text-xs font-medium">
            {(user.name?.[0] ?? user.email?.[0] ?? "U").toUpperCase()}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-surface border border-border rounded-xl shadow-[var(--shadow-lg)] py-2 z-50">
          {/* User info */}
          <div className="px-4 py-2 border-b border-border">
            <p className="text-sm font-medium text-foreground truncate">
              {user.name}
            </p>
            <p className="text-xs text-muted truncate">{user.email}</p>
            {plan && (
              <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/15 text-accent">
                {plan}
              </span>
            )}
          </div>

          {/* Links */}
          <div className="py-1">
            <Link
              href="/dashboard/billing"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-muted hover:text-foreground hover:bg-background transition-colors"
            >
              <CreditCard size={14} />
              Billing
            </Link>
          </div>

          {/* Sign out */}
          <div className="border-t border-border py-1">
            <form action={signOutAction}>
              <button
                type="submit"
                className="flex items-center gap-3 px-4 py-2 text-sm text-muted hover:text-foreground hover:bg-background transition-colors w-full text-left"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
