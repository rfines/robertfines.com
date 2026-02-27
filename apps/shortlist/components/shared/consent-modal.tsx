"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Sparkles, FileText, Target, BarChart2 } from "lucide-react";

const TOTAL_STEPS = 5;

interface TutorialStep {
  icon?: React.ReactNode;
  title: string;
  body: string;
}

const STEPS: TutorialStep[] = [
  {
    icon: <Sparkles size={20} className="text-[var(--accent)]" />,
    title: "Welcome to Retold",
    body: "AI-powered resume tailoring that helps you land more interviews. Here's how it works — takes 30 seconds to read.",
  },
  {
    icon: <FileText size={20} className="text-[var(--accent)]" />,
    title: "Add your base resume",
    body: "Paste your resume text or upload a PDF/DOCX file. This becomes your master resume — you'll tailor it fresh for each job you apply to.",
  },
  {
    icon: <Target size={20} className="text-[var(--accent)]" />,
    title: "Tailor to any job in seconds",
    body: "Paste a job description, pick your tailoring intensity, and Claude AI rewrites your resume to match — mirroring the job's language and surfacing your most relevant experience.",
  },
  {
    icon: <BarChart2 size={20} className="text-[var(--accent)]" />,
    title: "See exactly what changed",
    body: "A keyword match score shows how well your resume covers the role. The diff view highlights every edit the AI made. Download or copy when you're happy.",
  },
  {
    title: "One quick thing",
    body: "Can we send you occasional product tips and updates? We won't spam you.",
  },
];

export function WelcomeTutorial() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const current = STEPS[step - 1];
  const isConsentStep = step === TOTAL_STEPS;

  async function handleConsent(consent: boolean) {
    setIsSubmitting(true);
    try {
      await fetch("/api/user/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent }),
      });
    } finally {
      router.refresh();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl shadow-xl p-8 max-w-md w-full mx-4">

        {/* Icon */}
        {current.icon && (
          <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center mb-4">
            {current.icon}
          </div>
        )}

        {/* Text */}
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">
          {current.title}
        </h2>
        <p className="text-sm text-[var(--muted)] mb-6 min-h-[3.5rem]">
          {current.body}
        </p>

        {/* Step dots */}
        <div className="flex gap-1.5 mb-6">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <span
              key={i}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-colors",
                i < step ? "bg-[var(--accent)]" : "bg-[var(--border)]"
              )}
            />
          ))}
        </div>

        {/* Navigation */}
        {isConsentStep ? (
          <>
            <div className="flex flex-col sm:flex-row gap-3 mb-3">
              <Button
                onClick={() => handleConsent(true)}
                disabled={isSubmitting}
                className="flex-1"
              >
                Yes, keep me in the loop
              </Button>
              <Button
                variant="outline"
                onClick={() => handleConsent(false)}
                disabled={isSubmitting}
                className="flex-1"
              >
                No thanks
              </Button>
            </div>
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              ← Back
            </button>
          </>
        ) : (
          <div className="flex items-center justify-between">
            {step > 1 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep((s) => s - 1)}
              >
                ← Back
              </Button>
            ) : (
              <span />
            )}
            <Button size="sm" onClick={() => setStep((s) => s + 1)}>
              Next →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// Keep legacy name so the existing import in dashboard/layout.tsx still resolves
export { WelcomeTutorial as ConsentModal };
