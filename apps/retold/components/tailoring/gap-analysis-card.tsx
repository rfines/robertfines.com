"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Lock, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import type { Plan } from "@/lib/plan";
import { canViewGapAnalysis } from "@/lib/plan";
import type { GapItem, GapAnalysisResult } from "@/lib/generate-gap-analysis";
import Link from "next/link";
import { cn } from "@/lib/cn";

const PRIORITY_STYLES: Record<GapItem["priority"], string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  low: "bg-muted/10 text-muted border-muted/20",
};

const PRIORITY_LABEL: Record<GapItem["priority"], string> = {
  high: "Must-have",
  medium: "Should-have",
  low: "Nice-to-have",
};

function GapItemRow({ gap }: { gap: GapItem }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 space-y-2">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 shrink-0 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded border",
            PRIORITY_STYLES[gap.priority]
          )}
        >
          {PRIORITY_LABEL[gap.priority]}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground leading-snug">
            {gap.requirement}
          </p>
          <p className="text-xs text-muted mt-1 leading-relaxed">
            {gap.suggestion}
          </p>
          <p className="text-[10px] text-muted mt-1.5 opacity-70">
            Section: {gap.section}
          </p>
        </div>
      </div>
    </div>
  );
}

interface GapAnalysisCardProps {
  tailoredId: string;
  plan: Plan;
  initialGapAnalysis: GapAnalysisResult | null;
}

export function GapAnalysisCard({
  tailoredId,
  plan,
  initialGapAnalysis,
}: GapAnalysisCardProps) {
  const [gapAnalysis, setGapAnalysis] = useState<GapAnalysisResult | null>(
    initialGapAnalysis
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  const locked = !canViewGapAnalysis(plan);

  async function handleGenerate() {
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch(`/api/tailored/${tailoredId}/gap-analysis`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Analysis failed");
      }

      const data = await res.json();
      setGapAnalysis(data.gapAnalysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle size={14} className="text-destructive shrink-0" />
          <span className="text-sm font-semibold text-foreground">
            Gap Analysis
          </span>
        </div>
        {gapAnalysis && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-muted hover:text-foreground transition-colors"
            aria-label={expanded ? "Collapse gap analysis" : "Expand gap analysis"}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>

      <p className="text-xs text-muted mb-3">
        AI-powered analysis of what&apos;s missing from your resume relative to the job
        description — with specific, actionable suggestions for each gap.
      </p>

      {locked && (
        <div className="flex items-start gap-3 bg-surface border border-border rounded-xl px-4 py-3">
          <Lock size={14} className="text-muted mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-foreground">
              Gap Analysis is available on{" "}
              <Link href="/dashboard/billing" className="text-accent hover:underline">
                Starter and above
              </Link>
              .
            </p>
            <p className="text-xs text-muted mt-0.5">
              Upgrade to see exactly what&apos;s missing and how to close the gap.
            </p>
          </div>
        </div>
      )}

      {!locked && !gapAnalysis && !isGenerating && (
        <Button size="sm" variant="outline" onClick={handleGenerate}>
          Analyze Gaps
        </Button>
      )}

      {!locked && isGenerating && (
        <div className="flex items-center gap-3 text-sm text-muted">
          <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          Analyzing gaps with Claude…
        </div>
      )}

      {!locked && error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {!locked && gapAnalysis && expanded && (
        <div className="space-y-3">
          {gapAnalysis.gaps.map((gap, i) => (
            <GapItemRow key={i} gap={gap} />
          ))}

          {gapAnalysis.skillsToAdd.length > 0 && (
            <div className="bg-surface border border-border rounded-xl p-4">
              <p className="text-xs font-medium text-foreground mb-2">
                Skills to add to your resume
              </p>
              <div className="flex flex-wrap gap-1.5">
                {gapAnalysis.skillsToAdd.map((skill) => (
                  <span
                    key={skill}
                    className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
