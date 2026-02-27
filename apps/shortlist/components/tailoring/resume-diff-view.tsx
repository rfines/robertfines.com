"use client";

import { useState } from "react";
import { GitCompare, FileText, Lock } from "lucide-react";
import { diffWords } from "diff";
import type { Plan } from "@/lib/plan";
import { canViewDiff } from "@/lib/plan";
import Link from "next/link";

interface ResumeDiffViewProps {
  baseText: string;
  tailoredText: string;
  plan: Plan;
}

export function ResumeDiffView({ baseText, tailoredText, plan }: ResumeDiffViewProps) {
  const [showDiff, setShowDiff] = useState(false);
  const diffLocked = !canViewDiff(plan);

  const changes = showDiff && !diffLocked ? diffWords(baseText, tailoredText) : null;

  function handleToggle() {
    if (diffLocked) return;
    setShowDiff((v) => !v);
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-[var(--muted)]">
          {showDiff && !diffLocked ? (
            <>
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-green-400/20 border border-green-400/40 mr-1 align-middle" />
              Added
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-red-400/10 border border-red-400/30 ml-3 mr-1 align-middle" />
              Removed
            </>
          ) : null}
        </span>
        <button
          type="button"
          onClick={handleToggle}
          className="flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          {showDiff && !diffLocked ? (
            <>
              <FileText size={12} />
              View Resume
            </>
          ) : (
            <>
              <GitCompare size={12} />
              View Changes
            </>
          )}
        </button>
      </div>

      {diffLocked && showDiff === false && (
        // Show upgrade nudge when free user clicks the button via handleToggle → blocked,
        // so we render a persistent teaser below the toggle instead.
        null
      )}

      <pre className="text-xs text-[var(--foreground)] whitespace-pre-wrap font-mono leading-relaxed overflow-auto max-h-[60vh]">
        {showDiff && !diffLocked && changes
          ? changes.map((part, i) => {
              if (part.added) {
                return (
                  <mark
                    key={i}
                    className="bg-green-400/20 text-green-300 not-italic rounded-sm"
                  >
                    {part.value}
                  </mark>
                );
              }
              if (part.removed) {
                return (
                  <span key={i} className="line-through opacity-50 text-red-400">
                    {part.value}
                  </span>
                );
              }
              return <span key={i}>{part.value}</span>;
            })
          : tailoredText}
      </pre>

      {diffLocked && (
        <div className="mt-4 flex items-center gap-2 text-xs text-[var(--muted)] border-t border-[var(--border)] pt-3">
          <Lock size={11} className="shrink-0" />
          <span>
            Before/after diff view is available on{" "}
            <Link href="/dashboard/billing" className="text-[var(--accent)] hover:underline">
              Starter and above
            </Link>
            .
          </span>
        </div>
      )}
    </div>
  );
}
