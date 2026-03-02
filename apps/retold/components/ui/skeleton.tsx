import { cn } from "@/lib/cn";
import { type HTMLAttributes } from "react";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "line" | "circle" | "paragraph";
}

export function Skeleton({
  className,
  variant = "line",
  ...props
}: SkeletonProps) {
  if (variant === "paragraph") {
    return (
      <div className={cn("space-y-2", className)} {...props}>
        <div className="animate-pulse rounded-md bg-surface border border-border h-4 w-[80%]" />
        <div className="animate-pulse rounded-md bg-surface border border-border h-4 w-full" />
        <div className="animate-pulse rounded-md bg-surface border border-border h-4 w-[60%]" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "animate-pulse bg-surface border border-border",
        variant === "circle" ? "rounded-full" : "rounded-md",
        className
      )}
      {...props}
    />
  );
}
