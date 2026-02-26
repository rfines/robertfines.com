"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { KeywordMatchResult } from "@/lib/keyword-match";
import type { Plan } from "@/lib/plan";
import { canDownload } from "@/lib/plan";
import { DownloadMenu } from "@/components/tailoring/download-menu";
import { CopyButton } from "@/components/tailoring/copy-button";
import { KeywordMatchCard } from "@/components/tailoring/keyword-match-card";

interface Variation {
  id: string;
  variationIndex: number;
  tailoredText: string;
  keywordMatch: KeywordMatchResult;
}

interface VariationTabsProps {
  variations: Variation[];
  activeId: string;
  plan: Plan;
}

export function VariationTabs({ variations, activeId, plan }: VariationTabsProps) {
  const [activeVariationId, setActiveVariationId] = useState(activeId);
  const active = variations.find((v) => v.id === activeVariationId) ?? variations[0];

  if (!active) return null;

  const { keywordMatch } = active;

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 mb-4 border-b border-[var(--border)]">
        {variations.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setActiveVariationId(v.id)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
              v.id === activeVariationId
                ? "border-[var(--accent)] text-[var(--foreground)]"
                : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
            )}
          >
            Version {v.variationIndex + 1}
          </button>
        ))}
      </div>

      <KeywordMatchCard keywordMatch={keywordMatch} />

      {/* Resume text for active variation */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 mb-4">
        <pre className="text-xs text-[var(--foreground)] whitespace-pre-wrap font-mono leading-relaxed overflow-auto max-h-[60vh]">
          {active.tailoredText}
        </pre>
      </div>

      {/* Download / copy button for active variation */}
      <div className="flex justify-end">
        {canDownload(plan) ? (
          <DownloadMenu
            tailoredId={active.id}
            plan={plan}
            label={`Download Version ${active.variationIndex + 1}`}
          />
        ) : (
          <CopyButton text={active.tailoredText} label={`Copy Version ${active.variationIndex + 1}`} />
        )}
      </div>
    </div>
  );
}
