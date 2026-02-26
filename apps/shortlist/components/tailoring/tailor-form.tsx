"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import type { Intensity } from "@/types";
import type { Plan } from "@/lib/plan";
import { PLAN_LIMITS, canUseInstructions } from "@/lib/plan";
import { IntensitySelector } from "@/components/tailoring/intensity-selector";
import { VariationsSelector } from "@/components/tailoring/variations-selector";
import { InstructionsField } from "@/components/tailoring/instructions-field";

interface TailorFormProps {
  resumeId: string;
  resumeTitle: string;
  plan: Plan;
}

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
  const instructionsLocked = !canUseInstructions(plan);

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
        <IntensitySelector value={intensity} onChange={setIntensity} />
      </div>

      <div>
        <Label>Variations</Label>
        <p className="text-xs text-[var(--muted)] mb-1.5">
          Generate multiple tailored versions to choose from
        </p>
        <VariationsSelector value={variations} max={maxVariations} onChange={setVariations} />
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

      <InstructionsField
        value={userInstructions}
        onChange={setUserInstructions}
        locked={instructionsLocked}
      />

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
