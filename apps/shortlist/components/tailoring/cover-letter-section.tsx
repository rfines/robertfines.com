"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Lock, Download } from "lucide-react";
import type { Plan } from "@/lib/plan";
import { canGenerateCoverLetter, canExportPdf } from "@/lib/plan";
import { CopyButton } from "@/components/tailoring/copy-button";
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
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);

  const locked = !canGenerateCoverLetter(plan);
  const canPdf = canExportPdf(plan);

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

  async function handleDownload(format: "cover-letter-docx" | "cover-letter-pdf") {
    setDownloadingFormat(format);
    try {
      const res = await fetch(
        `/api/tailored/${tailoredId}/download?format=${format}`
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Download failed");
      }
      const blob = await res.blob();
      const ext = format === "cover-letter-pdf" ? "pdf" : "docx";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cover_letter.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloadingFormat(null);
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
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 space-y-4">
          <pre className="text-xs text-[var(--foreground)] whitespace-pre-wrap font-mono leading-relaxed overflow-auto max-h-[40vh]">
            {coverLetterText}
          </pre>
          <div className="flex items-center gap-2 pt-2 border-t border-[var(--border)]">
            <CopyButton text={coverLetterText} label="Copy" />
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDownload("cover-letter-docx")}
              disabled={downloadingFormat !== null}
            >
              <Download size={14} />
              {downloadingFormat === "cover-letter-docx" ? "Downloading…" : "DOCX"}
            </Button>
            {canPdf ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDownload("cover-letter-pdf")}
                disabled={downloadingFormat !== null}
              >
                <Download size={14} />
                {downloadingFormat === "cover-letter-pdf" ? "Downloading…" : "PDF"}
              </Button>
            ) : (
              <span className="text-xs text-[var(--muted)] flex items-center gap-1.5">
                <Lock size={12} />
                PDF —{" "}
                <Link href="/dashboard/billing" className="text-[var(--accent)] hover:underline">
                  Pro
                </Link>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
