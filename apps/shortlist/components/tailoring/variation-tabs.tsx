"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { KeywordMatchResult } from "@/lib/keyword-match";
import type { Plan } from "@/lib/plan";
import { canDownload } from "@/lib/plan";
import { DownloadMenu } from "@/components/tailoring/download-menu";
import { CopyButton } from "@/components/tailoring/copy-button";

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

      {/* Keyword match for active variation */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-sm font-medium text-[var(--foreground)]">Keyword Match</span>
          <span
            className={cn(
              "text-sm font-bold",
              keywordMatch.score >= 70
                ? "text-green-400"
                : keywordMatch.score >= 45
                  ? "text-yellow-400"
                  : "text-[var(--destructive)]"
            )}
          >
            {keywordMatch.score}%
          </span>
          <span className="text-xs text-[var(--muted)]">
            {keywordMatch.matched.length} / {keywordMatch.total} terms matched
          </span>
        </div>
        <div className="w-full h-1.5 bg-[var(--border)] rounded-full mb-3">
          <div
            className={cn(
              "h-1.5 rounded-full transition-all",
              keywordMatch.score >= 70
                ? "bg-green-400"
                : keywordMatch.score >= 45
                  ? "bg-yellow-400"
                  : "bg-[var(--destructive)]"
            )}
            style={{ width: `${keywordMatch.score}%` }}
          />
        </div>
        <details>
          <summary className="cursor-pointer text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors select-none">
            View matched &amp; missing terms
          </summary>
          <div className="mt-3 grid grid-cols-2 gap-4">
            {keywordMatch.matched.length > 0 && (
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
                <p className="text-xs font-medium text-green-400 mb-2">
                  Matched ({keywordMatch.matched.length})
                </p>
                <div className="flex flex-wrap gap-1">
                  {keywordMatch.matched.map((term) => (
                    <span
                      key={term}
                      className="text-xs px-2 py-0.5 rounded-full bg-green-400/10 text-green-400"
                    >
                      {term}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {keywordMatch.missing.length > 0 && (
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
                <p className="text-xs font-medium text-[var(--destructive)] mb-2">
                  Missing ({keywordMatch.missing.length})
                </p>
                <div className="flex flex-wrap gap-1">
                  {keywordMatch.missing.map((term) => (
                    <span
                      key={term}
                      className="text-xs px-2 py-0.5 rounded-full bg-[var(--destructive)]/10 text-[var(--destructive)]"
                    >
                      {term}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </details>
      </div>

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
