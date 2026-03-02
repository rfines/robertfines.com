import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  tips?: string[];
  action?: {
    label: string;
    href: string;
  };
}

export function EmptyState({
  title,
  description,
  icon,
  tips,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
      {icon && (
        <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent">
          {icon}
        </div>
      )}
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted max-w-sm">{description}</p>
      </div>
      {tips && tips.length > 0 && (
        <ul className="text-sm text-muted max-w-sm text-left space-y-1">
          {tips.map((tip) => (
            <li key={tip} className="flex items-start gap-2">
              <span className="text-accent mt-0.5 shrink-0">&#x2022;</span>
              {tip}
            </li>
          ))}
        </ul>
      )}
      {action && (
        <Link href={action.href}>
          <Button size="sm">{action.label}</Button>
        </Link>
      )}
    </div>
  );
}
