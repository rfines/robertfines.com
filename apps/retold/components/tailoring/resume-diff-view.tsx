"use client";

import { useState } from "react";
import { GitCompare, FileText, Lock } from "lucide-react";
import { diffWords } from "diff";
import type { Plan } from "@/lib/plan";
import { canViewDiff } from "@/lib/plan";
import { useUpgradeModal } from "@/components/shared/upgrade-modal";

interface ResumeDiffViewProps {
  baseText: string;
  tailoredText: string;
  plan: Plan;
}

export function ResumeDiffView({ baseText, tailoredText, plan }: ResumeDiffViewProps) {
  const [showDiff, setShowDiff] = useState(false);
  const diffLocked = !canViewDiff(plan);
  const { openUpgrade } = useUpgradeModal();

  const changes = showDiff && !diffLocked ? diffWords(baseText, tailoredText) : null;

  function handleToggle() {
    if (diffLocked) {
      openUpgrade("view-diff");
      return;
    }
    setShowDiff((v) => !v);
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-muted">
          {showDiff && !diffLocked ? (
            <>
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-success/20 border border-green-400/40 mr-1 align-middle" />
              Added
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-destructive/10 border border-red-400/30 ml-3 mr-1 align-middle" />
              Removed
            </>
          ) : null}
        </span>
        <button
          type="button"
          onClick={handleToggle}
          className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
        >
          {showDiff && !diffLocked ? (
            <>
              <FileText size={12} />
              View Resume
            </>
          ) : (
            <>
              {diffLocked && <Lock size={10} />}
              <GitCompare size={12} />
              View Changes
            </>
          )}
        </button>
      </div>

      <pre className="text-xs text-foreground whitespace-pre-wrap font-mono leading-relaxed overflow-auto max-h-[60vh]">
        {showDiff && !diffLocked && changes
          ? changes.map((part, i) => {
              if (part.added) {
                return (
                  <mark
                    key={i}
                    className="bg-success/20 text-success not-italic rounded-sm"
                  >
                    {part.value}
                  </mark>
                );
              }
              if (part.removed) {
                return (
                  <span key={i} className="line-through opacity-50 text-destructive">
                    {part.value}
                  </span>
                );
              }
              return <span key={i}>{part.value}</span>;
            })
          : tailoredText}
      </pre>
    </div>
  );
}
