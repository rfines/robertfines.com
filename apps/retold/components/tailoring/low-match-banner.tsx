"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface LowMatchBannerProps {
  score: number;
  resumeId: string;
  tailoredId: string;
}

export function LowMatchBanner({
  score,
  resumeId,
  tailoredId,
}: LowMatchBannerProps) {
  return (
    <div
      role="alert"
      className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3"
    >
      <AlertTriangle
        size={18}
        className="text-destructive mt-0.5 shrink-0"
      />
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">
          Low keyword coverage ({score}%)
        </p>
        <p className="text-xs text-muted mt-1">
          This resume may not pass ATS filters for this role. Review the gap
          analysis below to see what&apos;s missing, or re-tailor with
          aggressive intensity.
        </p>
        <div className="flex items-center gap-2 mt-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              document
                .getElementById("gap-analysis")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            See what&apos;s missing
          </Button>
          <Link
            href={`/dashboard/resumes/${resumeId}/tailor?from=${tailoredId}&intensity=aggressive`}
          >
            <Button size="sm">Re-tailor aggressively</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
