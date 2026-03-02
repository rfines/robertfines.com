import { cn } from "@/lib/cn";
import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-all",
        error &&
          "border-destructive focus-visible:ring-destructive",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
