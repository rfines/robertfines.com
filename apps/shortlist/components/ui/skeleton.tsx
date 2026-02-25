import { cn } from "@/lib/cn";
import { type HTMLAttributes } from "react";

export function Skeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-[var(--surface)] border border-[var(--border)]",
        className
      )}
      {...props}
    />
  );
}
