import { cn } from "@/lib/cn";
import { type TextareaHTMLAttributes, forwardRef } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-all resize-y min-h-[120px]",
        error &&
          "border-destructive focus-visible:ring-destructive",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
