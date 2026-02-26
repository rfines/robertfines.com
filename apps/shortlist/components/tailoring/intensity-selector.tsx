"use client";

import { cn } from "@/lib/cn";
import type { Intensity } from "@/types";

const INTENSITY_OPTIONS: { value: Intensity; label: string; description: string }[] = [
  { value: "conservative", label: "Conservative", description: "Light keyword rephrasing only" },
  { value: "moderate", label: "Moderate", description: "Reorder and reframe for relevance" },
  { value: "aggressive", label: "Aggressive", description: "Heavily restructure and rewrite" },
];

interface IntensitySelectorProps {
  value: Intensity;
  onChange: (v: Intensity) => void;
}

export function IntensitySelector({ value, onChange }: IntensitySelectorProps) {
  return (
    <div className="mt-1.5 flex rounded-lg border border-[var(--border)] overflow-hidden">
      {INTENSITY_OPTIONS.map(({ value: v, label, description }) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          title={description}
          className={cn(
            "flex-1 px-3 py-1.5 text-xs font-medium capitalize transition-colors",
            value === v
              ? "bg-[var(--accent)] text-white"
              : "text-[var(--muted)] hover:text-[var(--foreground)]"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
