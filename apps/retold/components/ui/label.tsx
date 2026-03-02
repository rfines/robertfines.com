import { cn } from "@/lib/cn";
import { type LabelHTMLAttributes, forwardRef } from "react";

export const Label = forwardRef<
  HTMLLabelElement,
  LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "block text-sm font-medium text-[var(--foreground)] mb-1.5",
      className
    )}
    {...props}
  />
));
Label.displayName = "Label";
