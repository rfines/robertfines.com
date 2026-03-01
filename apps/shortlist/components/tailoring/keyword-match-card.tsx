"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { KeywordMatchResult } from "@/lib/keyword-match";

interface KeywordMatchCardProps {
  keywordMatch: KeywordMatchResult;
  tailoredResumeId?: string;
  initialFlaggedTerms?: string[];
}

export function KeywordMatchCard({
  keywordMatch,
  tailoredResumeId,
  initialFlaggedTerms = [],
}: KeywordMatchCardProps) {
  const [flagged, setFlagged] = useState<Set<string>>(new Set(initialFlaggedTerms));

  const scoreColor =
    keywordMatch.score >= 70
      ? "text-green-400"
      : keywordMatch.score >= 45
        ? "text-yellow-400"
        : "text-[var(--destructive)]";

  const barColor =
    keywordMatch.score >= 70
      ? "bg-green-400"
      : keywordMatch.score >= 45
        ? "bg-yellow-400"
        : "bg-[var(--destructive)]";

  const hint =
    keywordMatch.score >= 70
      ? "Strong coverage — your resume aligns well with this role."
      : keywordMatch.score >= 45
        ? "Moderate coverage — consider re-tailoring at a higher intensity."
        : "Low coverage — try aggressive tailoring or check for missing sections.";

  function handleFlag(term: string) {
    setFlagged((prev) => new Set([...prev, term]));
    if (tailoredResumeId) {
      fetch("/api/keyword-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tailoredResumeId, term }),
      }).catch(() => {
        // fire-and-forget; revert on error
        setFlagged((prev) => {
          const next = new Set(prev);
          next.delete(term);
          return next;
        });
      });
    }
  }

  const visibleMissing = keywordMatch.missing.filter((t) => !flagged.has(t));
  const dismissedMissing = keywordMatch.missing.filter((t) => flagged.has(t));
  const canFlag = Boolean(tailoredResumeId);

  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-1">
        <span className="text-sm font-medium text-[var(--foreground)]">Keyword Match</span>
        <span className={cn("text-sm font-bold", scoreColor)}>
          {keywordMatch.score}%
        </span>
        <span className="text-xs text-[var(--muted)]">
          {keywordMatch.matched.length} / {keywordMatch.total} terms matched
        </span>
      </div>
      <p className="text-xs text-[var(--muted)] mb-2">
        Measures how many key terms from the job description appear in your tailored resume.
        ATS systems use these terms to filter candidates.
      </p>
      <div className="w-full h-1.5 bg-[var(--border)] rounded-full">
        <div
          className={cn("h-1.5 rounded-full transition-all", barColor)}
          style={{ width: `${keywordMatch.score}%` }}
        />
      </div>
      <p className={cn("text-xs mt-2 mb-3", scoreColor)}>{hint}</p>
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
          {(visibleMissing.length > 0 || dismissedMissing.length > 0) && (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
              <p className="text-xs font-medium text-[var(--destructive)] mb-2">
                Missing ({visibleMissing.length})
                {canFlag && (
                  <span className="text-[var(--muted)] font-normal ml-1">
                    — click × to dismiss irrelevant terms
                  </span>
                )}
              </p>
              <div className="flex flex-wrap gap-1">
                {visibleMissing.map((term) => (
                  <span
                    key={term}
                    className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[var(--destructive)]/10 text-[var(--destructive)]"
                  >
                    {term}
                    {canFlag && (
                      <button
                        type="button"
                        onClick={() => handleFlag(term)}
                        className="opacity-50 hover:opacity-100 transition-opacity leading-none"
                        aria-label={`Dismiss "${term}" as not relevant`}
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
                {dismissedMissing.length > 0 && (
                  <span className="text-xs text-[var(--muted)] self-center">
                    +{dismissedMissing.length} dismissed
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </details>
    </div>
  );
}
