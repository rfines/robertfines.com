import { cn } from "@/lib/cn";
import { type ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none",
          {
            "bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white":
              variant === "default",
            "border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--accent)] hover:text-[var(--accent)] bg-transparent":
              variant === "outline",
            "text-[var(--muted)] hover:text-[var(--foreground)] bg-transparent":
              variant === "ghost",
            "bg-[var(--destructive)] hover:bg-red-600 text-white":
              variant === "destructive",
          },
          {
            "text-xs px-3 py-1.5": size === "sm",
            "text-sm px-4 py-2": size === "md",
            "text-base px-6 py-3": size === "lg",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
