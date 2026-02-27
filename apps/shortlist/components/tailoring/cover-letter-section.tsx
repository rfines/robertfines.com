"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Lock } from "lucide-react";
import type { Plan } from "@/lib/plan";
import { canGenerateCoverLetter } from "@/lib/plan";
import Link from "next/link";

interface CoverLetterSectionProps {
  tailoredId: string;
  initialCoverLetterText: string | null;
  plan: Plan;
}

export function CoverLetterSection({
  tailoredId,
  initialCoverLetterText,
  plan,
}: CoverLetterSectionProps) {
  const [coverLetterText, setCoverLetterText] = useState<string | null>(
    initialCoverLetterText
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locked = !canGenerateCoverLetter(plan);

  async function handleGenerate() {
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch(`/api/tailored/${tailoredId}/cover-letter`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Generation failed");
      }

      const data = await res.json();
      setCoverLetterText(data.coverLetterText);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">
          Cover Letter
        </h2>
        {!locked && !coverLetterText && !isGenerating && (
          <Button size="sm" variant="outline" onClick={handleGenerate}>
            <FileText size={14} />
            Generate Cover Letter
          </Button>
        )}
      </div>

      {locked && (
        <div className="flex items-start gap-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3">
          <Lock size={14} className="text-[var(--muted)] mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-[var(--foreground)]">
              Cover letter generation is available on{" "}
              <Link href="/dashboard/billing" className="text-[var(--accent)] hover:underline">
                Starter and above
              </Link>
              .
            </p>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Upgrade to generate a tailored cover letter matched to this job.
            </p>
          </div>
        </div>
      )}

      {!locked && isGenerating && (
        <div className="flex items-center gap-3 text-sm text-[var(--muted)]">
          <div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          Generating cover letter with Claude… this may take 10–20 seconds
        </div>
      )}

      {!locked && error && (
        <p className="text-sm text-[var(--destructive)]">{error}</p>
      )}

      {!locked && coverLetterText && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
          <pre className="text-xs text-[var(--foreground)] whitespace-pre-wrap font-mono leading-relaxed overflow-auto max-h-[40vh]">
            {coverLetterText}
          </pre>
        </div>
      )}
    </div>
  );
}
