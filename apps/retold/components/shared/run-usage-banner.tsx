import Link from "next/link";
import type { RunUsage } from "@/lib/get-run-usage";

interface Props {
  usage: RunUsage;
}

export function RunUsageBanner({ usage }: Props) {
  if (usage.limit === null) return null;

  const pct = Math.min(100, Math.round((usage.used / usage.limit) * 100));
  const isNearLimit = usage.remaining !== null && usage.remaining <= 3;
  const isAtLimit = usage.remaining === 0;

  return (
    <div
      className={`rounded-lg border px-4 py-3 text-sm ${
        isAtLimit
          ? "border-red-500/30 bg-red-500/5 text-red-400"
          : isNearLimit
          ? "border-amber-500/30 bg-amber-500/5 text-amber-400"
          : "border-[var(--border)] bg-[var(--card)] text-[var(--muted)]"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span>
          {isAtLimit ? (
            "Monthly tailoring limit reached"
          ) : (
            <>
              <span className={isNearLimit ? "" : "text-[var(--foreground)] font-medium"}>
                {usage.remaining}
              </span>{" "}
              run{usage.remaining !== 1 ? "s" : ""} left this month
            </>
          )}
        </span>
        <Link
          href="/dashboard/billing"
          className="text-[var(--accent)] hover:underline text-xs font-medium"
        >
          Upgrade
        </Link>
      </div>
      <div className="h-1 rounded-full bg-[var(--border)]">
        <div
          className={`h-1 rounded-full transition-all ${
            isAtLimit ? "bg-red-500" : isNearLimit ? "bg-amber-500" : "bg-[var(--accent)]"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-xs opacity-60">
        {usage.used} of {usage.limit} runs used
      </p>
    </div>
  );
}
