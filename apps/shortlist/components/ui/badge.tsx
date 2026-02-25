import { cn } from "@/lib/cn";
import { type HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "muted";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        {
          "bg-[var(--accent)]/15 text-[var(--accent)]": variant === "default",
          "bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)]":
            variant === "muted",
        },
        className
      )}
      {...props}
    />
  );
}
