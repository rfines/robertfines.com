"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CopyButton } from "@/components/tailoring/copy-button";
import type { Plan } from "@/lib/plan";
import { canUseLinkedInOptimizer } from "@/lib/plan";

interface Resume {
  id: string;
  title: string;
  rawText: string;
}

interface LinkedInOptimizerFormProps {
  resumes: Resume[];
  plan: Plan;
}

export function LinkedInOptimizerForm({ resumes, plan }: LinkedInOptimizerFormProps) {
  const locked = !canUseLinkedInOptimizer(plan);
  const [selectedResumeId, setSelectedResumeId] = useState(resumes[0]?.id ?? "");
  const [jobTitle, setJobTitle] = useState("");
  const [result, setResult] = useState<{ headline: string; summary: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (locked) {
    return (
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 flex items-start gap-4">
        <Lock size={16} className="text-[var(--muted)] mt-0.5 shrink-0" />
        <div>
          <p className="text-sm text-[var(--foreground)] font-medium mb-1">
            LinkedIn Optimizer is available on Pro and Agency
          </p>
          <p className="text-xs text-[var(--muted)] mb-3">
            Upgrade to generate a compelling LinkedIn headline and About section tailored to your
            resume and target role.
          </p>
          <Link href="/dashboard/billing">
            <Button size="sm">Upgrade to Pro</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (resumes.length === 0) {
    return (
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 text-sm text-[var(--muted)]">
        No resumes found.{" "}
        <Link href="/dashboard/resumes" className="text-[var(--accent)] hover:underline">
          Upload a resume
        </Link>{" "}
        to get started.
      </div>
    );
  }

  async function handleGenerate() {
    const resume = resumes.find((r) => r.id === selectedResumeId);
    if (!resume || isLoading) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/tools/linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: resume.rawText,
          jobTitle: jobTitle.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="resumeSelect">Resume</Label>
        <select
          id="resumeSelect"
          value={selectedResumeId}
          onChange={(e) => setSelectedResumeId(e.target.value)}
          className="mt-1.5 w-full text-sm bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        >
          {resumes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.title}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="jobTitle">Target job title (optional)</Label>
        <Input
          id="jobTitle"
          placeholder="e.g. Senior Software Engineer"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          className="mt-1.5"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center gap-3 text-sm text-[var(--muted)]">
          <div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          Generating with Claude… (~10 seconds)
        </div>
      ) : (
        <Button onClick={handleGenerate} disabled={!selectedResumeId}>
          Generate
        </Button>
      )}

      {error && <p className="text-sm text-[var(--destructive)]">{error}</p>}

      {result && (
        <div className="space-y-4">
          {/* Headline */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">
                Headline
              </p>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[var(--muted)]">
                  {result.headline.length}/220 chars
                </span>
                <CopyButton text={result.headline} />
              </div>
            </div>
            <p className="text-sm text-[var(--foreground)]">{result.headline}</p>
          </div>

          {/* Summary / About */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">
                About Section
              </p>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[var(--muted)]">
                  {result.summary.length}/2600 chars
                </span>
                <CopyButton text={result.summary} />
              </div>
            </div>
            <pre className="text-sm text-[var(--foreground)] whitespace-pre-wrap font-sans leading-relaxed overflow-auto max-h-[40vh]">
              {result.summary}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
