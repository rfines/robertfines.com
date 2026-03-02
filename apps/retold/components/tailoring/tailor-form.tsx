"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles, RefreshCw, Gauge } from "lucide-react";
import type { Intensity } from "@/types";
import type { Plan } from "@/lib/plan";
import { PLAN_LIMITS, canUseInstructions, canFixAtsIssues } from "@/lib/plan";
import { cn } from "@/lib/cn";
import { IntensitySelector } from "@/components/tailoring/intensity-selector";
import { VariationsSelector } from "@/components/tailoring/variations-selector";
import { InstructionsField } from "@/components/tailoring/instructions-field";

interface InitialValues {
  jobTitle: string;
  company?: string;
  jobDescription: string;
  intensity: Intensity;
  userInstructions?: string;
}

interface TailorFormProps {
  resumeId: string;
  resumeTitle: string;
  plan: Plan;
  initialValues?: InitialValues;
}

export function TailorForm({ resumeId, resumeTitle, plan, initialValues }: TailorFormProps) {
  const router = useRouter();
  const [jobTitle, setJobTitle] = useState(initialValues?.jobTitle ?? "");
  const [company, setCompany] = useState(initialValues?.company ?? "");
  const [jobDescription, setJobDescription] = useState(initialValues?.jobDescription ?? "");
  const [intensity, setIntensity] = useState<Intensity>(
    (initialValues?.intensity as Intensity) ?? "moderate"
  );
  const [variations, setVariations] = useState(1);
  const [userInstructions, setUserInstructions] = useState(
    initialValues?.userInstructions ?? ""
  );
  const [fixAtsIssues, setFixAtsIssues] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-tailor fit estimate
  const [fitScore, setFitScore] = useState<number | null>(null);
  const [fitStatus, setFitStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [fitError, setFitError] = useState<string | null>(null);

  // JD URL fetch
  const [jdUrl, setJdUrl] = useState("");
  const [jdFetchStatus, setJdFetchStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );
  const [jdFetchError, setJdFetchError] = useState<string | null>(null);

  const maxVariations = PLAN_LIMITS[plan].variations;
  const instructionsLocked = !canUseInstructions(plan);
  const atsLocked = !canFixAtsIssues(plan);

  async function handleFetchJd() {
    if (!jdUrl.trim() || jdFetchStatus === "loading") return;
    setJdFetchStatus("loading");
    setJdFetchError(null);
    try {
      const res = await fetch("/api/jd-fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: jdUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not fetch that URL");
      setJobDescription(data.text);
      setJdFetchStatus("done");
    } catch (err) {
      setJdFetchError(err instanceof Error ? err.message : "Could not fetch that URL");
      setJdFetchStatus("error");
    }
  }

  async function handleCheckFit() {
    if (!jobDescription.trim() || fitStatus === "loading") return;
    setFitStatus("loading");
    setFitError(null);
    setFitScore(null);
    try {
      const res = await fetch(`/api/resumes/${resumeId}/quick-fit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription: jobDescription.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not estimate fit");
      setFitScore(data.score as number);
      setFitStatus("done");
    } catch (err) {
      setFitError(err instanceof Error ? err.message : "Could not estimate fit");
      setFitStatus("error");
    }
  }

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
          fixAtsIssues: fixAtsIssues && !atsLocked,
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
      <div className="bg-surface border border-border rounded-lg px-4 py-3 text-sm text-muted">
        Base resume: <span className="text-foreground font-medium">{resumeTitle}</span>
      </div>

      {initialValues && (
        <div className="flex items-center gap-2 bg-accent/5 border border-accent/20 rounded-lg px-4 py-2.5 text-sm">
          <RefreshCw size={13} className="text-accent shrink-0" />
          <span className="text-muted">
            Re-tailoring:{" "}
            <span className="text-foreground font-medium">
              {initialValues.jobTitle}
              {initialValues.company ? ` at ${initialValues.company}` : ""}
            </span>
          </span>
        </div>
      )}

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
        <p className="text-xs text-muted mb-1.5">
          Generate multiple tailored versions to choose from
        </p>
        <VariationsSelector value={variations} max={maxVariations} onChange={setVariations} />
      </div>

      <div>
        <Label htmlFor="jobDescription">Job Description *</Label>
        <div className="flex gap-2 mb-2 mt-1.5">
          <Input
            placeholder="Paste job posting URL (optional)"
            value={jdUrl}
            onChange={(e) => {
              setJdUrl(e.target.value);
              if (jdFetchStatus !== "idle") setJdFetchStatus("idle");
            }}
            className="text-sm"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleFetchJd}
            disabled={!jdUrl.trim() || jdFetchStatus === "loading"}
            className="shrink-0"
          >
            {jdFetchStatus === "loading"
              ? "Fetching…"
              : jdFetchStatus === "done"
              ? "Fetched ✓"
              : jdFetchStatus === "error"
              ? "Retry"
              : "Fetch JD"}
          </Button>
        </div>
        {jdFetchError && (
          <p className="text-xs text-destructive mb-1">{jdFetchError}</p>
        )}
        <Textarea
          id="jobDescription"
          placeholder="Paste the full job description here…"
          value={jobDescription}
          onChange={(e) => {
            setJobDescription(e.target.value);
            if (fitStatus !== "idle") {
              setFitStatus("idle");
              setFitScore(null);
            }
          }}
          className="min-h-[240px]"
          required
        />
        {jobDescription.trim().length >= 50 && (
          <div className="mt-2 flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCheckFit}
              disabled={fitStatus === "loading"}
            >
              <Gauge size={13} />
              {fitStatus === "loading" ? "Estimating…" : "Check Fit"}
            </Button>
            {fitStatus === "done" && fitScore !== null && (
              <span
                className={cn(
                  "text-sm font-semibold",
                  fitScore >= 70
                    ? "text-success"
                    : fitScore >= 45
                      ? "text-warning"
                      : "text-destructive"
                )}
              >
                {fitScore}% match
                <span className="text-xs font-normal text-muted ml-1">
                  {fitScore >= 70
                    ? "— strong baseline"
                    : fitScore >= 45
                      ? "— moderate baseline"
                      : "— low baseline, tailoring will help"}
                </span>
              </span>
            )}
            {fitStatus === "error" && fitError && (
              <span className="text-xs text-destructive">{fitError}</span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="fixAtsIssues"
          checked={fixAtsIssues && !atsLocked}
          onChange={(e) => !atsLocked && setFixAtsIssues(e.target.checked)}
          disabled={atsLocked}
          className="mt-0.5 h-4 w-4 rounded border-border accent-accent disabled:cursor-not-allowed"
        />
        <div>
          <div className="flex items-center gap-2">
            <label
              htmlFor="fixAtsIssues"
              className={`text-sm font-medium ${atsLocked ? "text-muted cursor-not-allowed" : "cursor-pointer"}`}
            >
              Fix ATS issues
            </label>
            {atsLocked && (
              <span className="text-[10px] bg-surface text-muted border border-border rounded px-1.5 py-0.5 flex items-center gap-1">
                <Lock size={9} />
                Pro
              </span>
            )}
          </div>
          <p className="text-xs text-muted mt-0.5">
            {atsLocked
              ? "Upgrade to Pro to automatically fix ATS formatting issues"
              : "Automatically fix formatting issues (tables, fancy bullets, separators) that ATS systems struggle to parse"}
          </p>
        </div>
      </div>

      <InstructionsField
        value={userInstructions}
        onChange={setUserInstructions}
        locked={instructionsLocked}
      />

      {error && <p className="text-sm text-destructive">{error}</p>}

      {isSubmitting ? (
        <div className="flex items-center gap-3 text-sm text-muted">
          <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
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
