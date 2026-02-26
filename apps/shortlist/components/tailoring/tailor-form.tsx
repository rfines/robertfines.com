"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Intensity } from "@/types";

interface TailorFormProps {
  resumeId: string;
  resumeTitle: string;
}

const INTENSITY_OPTIONS: { value: Intensity; label: string; description: string }[] = [
  { value: "conservative", label: "Conservative", description: "Light keyword rephrasing only" },
  { value: "moderate", label: "Moderate", description: "Reorder and reframe for relevance" },
  { value: "aggressive", label: "Aggressive", description: "Heavily restructure and rewrite" },
];

export function TailorForm({ resumeId, resumeTitle }: TailorFormProps) {
  const router = useRouter();
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [intensity, setIntensity] = useState<Intensity>("moderate");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!jobTitle.trim() || !jobDescription.trim()) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId,
          jobTitle: jobTitle.trim(),
          company: company.trim() || undefined,
          jobDescription: jobDescription.trim(),
          intensity,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Tailoring failed");
      }

      const tailored = await res.json();
      router.push(`/dashboard/tailored/${tailored.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm text-[var(--muted)]">
        Base resume: <span className="text-[var(--foreground)] font-medium">{resumeTitle}</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="jobTitle">Job Title *</Label>
          <Input
            id="jobTitle"
            placeholder="e.g. Senior Software Engineer"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="company">Company (optional)</Label>
          <Input
            id="company"
            placeholder="e.g. Stripe"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label>Tailoring Intensity</Label>
        <div className="mt-1.5 flex rounded-lg border border-[var(--border)] overflow-hidden">
          {INTENSITY_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setIntensity(value)}
              title={INTENSITY_OPTIONS.find((o) => o.value === value)?.description}
              className={cn(
                "flex-1 px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                intensity === value
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="jobDescription">Job Description *</Label>
        <Textarea
          id="jobDescription"
          placeholder="Paste the full job description here…"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          className="min-h-[240px]"
          required
        />
      </div>

      {error && <p className="text-sm text-[var(--destructive)]">{error}</p>}

      {isSubmitting ? (
        <div className="flex items-center gap-3 text-sm text-[var(--muted)]">
          <div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          Generating tailored resume with Claude… this may take 15–30 seconds
        </div>
      ) : (
        <Button
          type="submit"
          size="lg"
          disabled={!jobTitle.trim() || !jobDescription.trim()}
        >
          <Sparkles size={16} />
          Tailor Resume
        </Button>
      )}
    </form>
  );
}
