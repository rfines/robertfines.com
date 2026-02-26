"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles, Lock } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Intensity } from "@/types";
import type { Plan } from "@/lib/plan";
import { PLAN_LIMITS, canUseInstructions } from "@/lib/plan";

interface TailorFormProps {
  resumeId: string;
  resumeTitle: string;
  plan: Plan;
}

const INTENSITY_OPTIONS: { value: Intensity; label: string; description: string }[] = [
  { value: "conservative", label: "Conservative", description: "Light keyword rephrasing only" },
  { value: "moderate", label: "Moderate", description: "Reorder and reframe for relevance" },
  { value: "aggressive", label: "Aggressive", description: "Heavily restructure and rewrite" },
];

const VARIATION_OPTIONS = [1, 2, 3] as const;

const VARIATION_UPGRADE_LABEL: Record<number, string> = {
  2: "Starter",
  3: "Pro",
};

export function TailorForm({ resumeId, resumeTitle, plan }: TailorFormProps) {
  const router = useRouter();
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [intensity, setIntensity] = useState<Intensity>("moderate");
  const [variations, setVariations] = useState(1);
  const [userInstructions, setUserInstructions] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxVariations = PLAN_LIMITS[plan].variations;
  const instructionsEnabled = canUseInstructions(plan);

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
          variations,
          userInstructions: userInstructions.trim() || undefined,
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
        <Label>Variations</Label>
        <p className="text-xs text-[var(--muted)] mb-1.5">
          Generate multiple tailored versions to choose from
        </p>
        <div className="flex rounded-lg border border-[var(--border)] overflow-hidden w-fit">
          {VARIATION_OPTIONS.map((n) => {
            const locked = n > maxVariations;
            const upgradeLabel = VARIATION_UPGRADE_LABEL[n];
            return (
              <button
                key={n}
                type="button"
                onClick={() => !locked && setVariations(n)}
                title={locked ? `Upgrade to ${upgradeLabel} to unlock` : undefined}
                className={cn(
                  "flex items-center gap-1 px-4 py-1.5 text-xs font-medium transition-colors",
                  variations === n && !locked
                    ? "bg-[var(--accent)] text-white"
                    : locked
                    ? "text-[var(--muted)] opacity-50 cursor-not-allowed"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                )}
              >
                {locked && <Lock size={10} />}
                {n}
                {locked && upgradeLabel && (
                  <span className="ml-1 text-[10px] bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)] rounded px-1">
                    {upgradeLabel}
                  </span>
                )}
              </button>
            );
          })}
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

      <div>
        <div className="flex items-center gap-2 mb-1">
          <Label htmlFor="userInstructions">Custom instructions (optional)</Label>
          {!instructionsEnabled && (
            <span className="text-[10px] bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)] rounded px-1.5 py-0.5 flex items-center gap-1">
              <Lock size={9} />
              Starter
            </span>
          )}
        </div>
        <Textarea
          id="userInstructions"
          placeholder={
            instructionsEnabled
              ? "e.g. Emphasize my leadership experience and Python skills"
              : "Upgrade to Starter to add custom instructions"
          }
          value={userInstructions}
          onChange={(e) => setUserInstructions(e.target.value)}
          disabled={!instructionsEnabled}
          maxLength={500}
          className="min-h-[80px]"
        />
        {instructionsEnabled && (
          <p className="text-xs text-[var(--muted)] mt-1">{userInstructions.length}/500</p>
        )}
      </div>

      {error && <p className="text-sm text-[var(--destructive)]">{error}</p>}

      {isSubmitting ? (
        <div className="flex items-center gap-3 text-sm text-[var(--muted)]">
          <div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          {variations > 1
            ? `Generating ${variations} variations with Claude… this may take 30–60 seconds`
            : "Generating tailored resume with Claude… this may take 15–30 seconds"}
        </div>
      ) : (
        <Button
          type="submit"
          size="lg"
          disabled={!jobTitle.trim() || !jobDescription.trim()}
        >
          <Sparkles size={16} />
          {variations > 1 ? `Tailor Resume (${variations} variations)` : "Tailor Resume"}
        </Button>
      )}
    </form>
  );
}
