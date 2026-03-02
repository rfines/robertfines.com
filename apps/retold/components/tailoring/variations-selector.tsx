"use client";

import { cn } from "@/lib/cn";
import { Lock } from "lucide-react";

const VARIATION_OPTIONS = [1, 2, 3] as const;

const VARIATION_UPGRADE_LABEL: Record<number, string> = {
  2: "Starter",
  3: "Pro",
};

interface VariationsSelectorProps {
  value: number;
  max: number;
  onChange: (n: number) => void;
}

export function VariationsSelector({ value, max, onChange }: VariationsSelectorProps) {
  return (
    <div className="flex rounded-lg border border-[var(--border)] overflow-hidden w-fit">
      {VARIATION_OPTIONS.map((n) => {
        const locked = n > max;
        const upgradeLabel = VARIATION_UPGRADE_LABEL[n];
        return (
          <button
            key={n}
            type="button"
            onClick={() => !locked && onChange(n)}
            title={locked ? `Upgrade to ${upgradeLabel} to unlock` : undefined}
            className={cn(
              "flex items-center gap-1 px-4 py-1.5 text-xs font-medium transition-colors",
              value === n && !locked
                ? "bg-[var(--accent)] text-white"
                : locked
                ? "text-[var(--muted)] opacity-50 cursor-not-allowed"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            )}
          >
            {locked && <Lock size={10} />}
            {n}
            {locked && upgradeLabel && (
              <span className="ml-1 text-[10px] bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)] rounded px-1">
                {upgradeLabel}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
