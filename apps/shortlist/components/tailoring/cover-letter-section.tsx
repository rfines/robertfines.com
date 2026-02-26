"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

interface CoverLetterSectionProps {
  tailoredId: string;
  initialCoverLetterText: string | null;
}

export function CoverLetterSection({
  tailoredId,
  initialCoverLetterText,
}: CoverLetterSectionProps) {
  const [coverLetterText, setCoverLetterText] = useState<string | null>(
    initialCoverLetterText
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        {!coverLetterText && !isGenerating && (
          <Button size="sm" variant="outline" onClick={handleGenerate}>
            <FileText size={14} />
            Generate Cover Letter
          </Button>
        )}
      </div>

      {isGenerating && (
        <div className="flex items-center gap-3 text-sm text-[var(--muted)]">
          <div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          Generating cover letter with Claude… this may take 10–20 seconds
        </div>
      )}

      {error && <p className="text-sm text-[var(--destructive)]">{error}</p>}

      {coverLetterText && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
          <pre className="text-xs text-[var(--foreground)] whitespace-pre-wrap font-mono leading-relaxed overflow-auto max-h-[40vh]">
            {coverLetterText}
          </pre>
        </div>
      )}
    </div>
  );
}
