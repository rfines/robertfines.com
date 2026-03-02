import Link from "next/link";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-[var(--foreground)]">
          {title}
        </h3>
        <p className="text-sm text-[var(--muted)] max-w-sm">{description}</p>
      </div>
      {action && (
        <Link href={action.href}>
          <Button size="sm">{action.label}</Button>
        </Link>
      )}
    </div>
  );
}
