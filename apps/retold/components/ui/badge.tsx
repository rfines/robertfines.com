import { cn } from "@/lib/cn";
import { type HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "muted" | "success" | "warning" | "info" | "destructive";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        {
          "bg-accent/15 text-accent": variant === "default",
          "bg-surface text-muted border border-border": variant === "muted",
          "bg-success/15 text-success": variant === "success",
          "bg-warning/15 text-warning": variant === "warning",
          "bg-info/15 text-info": variant === "info",
          "bg-destructive/15 text-destructive": variant === "destructive",
        },
        className
      )}
      {...props}
    />
  );
}
