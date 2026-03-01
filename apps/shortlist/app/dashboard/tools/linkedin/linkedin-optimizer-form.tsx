"use client";

import { useState } from "react";
import { Lock, Linkedin, AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

type LinkedInStatus =
  | {
      connected: true;
      name: string | null;
      headline: string | null;
      pictureUrl: string | null;
      isStale: boolean;
      canConnect: boolean;
    }
  | { connected: false; canConnect: boolean };

interface LinkedInOptimizerFormProps {
  resumes: Resume[];
  plan: Plan;
  linkedInStatus: LinkedInStatus;
  flashConnected: boolean;
  flashError: boolean;
}

export function LinkedInOptimizerForm({
  resumes,
  plan,
  linkedInStatus,
  flashConnected,
  flashError,
}: LinkedInOptimizerFormProps) {
  const router = useRouter();
  const locked = !canUseLinkedInOptimizer(plan);

  const [selectedResumeId, setSelectedResumeId] = useState(resumes[0]?.id ?? "");
  const [jobTitle, setJobTitle] = useState("");
  const [result, setResult] = useState<{ headline: string; summary: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

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
    if (!resume || isGenerating) return;
    setIsGenerating(true);
    setGenerateError(null);
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
      setGenerateError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleImport() {
    setIsImporting(true);
    setImportError(null);
    try {
      const res = await fetch("/api/integrations/linkedin/import", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      router.push(`/dashboard/resumes/${data.resumeId}`);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Import failed");
      setIsImporting(false);
    }
  }

  async function handleDisconnect() {
    setIsDisconnecting(true);
    try {
      await fetch("/api/integrations/linkedin/disconnect", { method: "POST" });
      router.refresh();
    } finally {
      setIsDisconnecting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Flash notifications */}
      {flashConnected && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          <CheckCircle2 size={14} className="shrink-0" />
          LinkedIn connected successfully.
        </div>
      )}
      {flashError && (
        <div className="flex items-center gap-2 text-sm text-[var(--destructive)] bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <AlertTriangle size={14} className="shrink-0" />
          Could not connect to LinkedIn. Please try again.
        </div>
      )}

      {/* LinkedIn connection panel */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Linkedin size={16} className="text-[#0077B5]" />
          <p className="text-sm font-semibold">LinkedIn Account</p>
        </div>

        {linkedInStatus.connected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {linkedInStatus.pictureUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={linkedInStatus.pictureUrl}
                  alt={linkedInStatus.name ?? "Profile"}
                  className="w-9 h-9 rounded-full object-cover"
                />
              )}
              <div>
                <p className="text-sm font-medium">{linkedInStatus.name ?? "Connected"}</p>
                {linkedInStatus.headline && (
                  <p className="text-xs text-[var(--muted)] truncate max-w-xs">
                    {linkedInStatus.headline}
                  </p>
                )}
              </div>
            </div>

            {linkedInStatus.isStale && (
              <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                Your LinkedIn profile was last synced more than 30 days ago. Reconnect to refresh
                your cached data.
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleImport}
                disabled={isImporting}
              >
                {isImporting ? "Importing…" : "Import as resume"}
              </Button>
              <button
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="text-xs text-[var(--muted)] hover:text-[var(--destructive)] transition-colors"
              >
                {isDisconnecting ? "Disconnecting…" : "Disconnect"}
              </button>
            </div>
            {importError && <p className="text-xs text-[var(--destructive)]">{importError}</p>}
          </div>
        ) : (
          <div>
            <p className="text-xs text-[var(--muted)] mb-3">
              {linkedInStatus.canConnect
                ? "Connect your LinkedIn account to import your profile as a resume base."
                : "LinkedIn account connection is available on Pro and Agency plans."}
            </p>
            {linkedInStatus.canConnect ? (
              <a href="/api/integrations/linkedin/connect">
                <Button size="sm" variant="outline" className="gap-2">
                  <Linkedin size={14} />
                  Connect LinkedIn
                </Button>
              </a>
            ) : (
              <Link href="/dashboard/billing">
                <Button size="sm" variant="outline">
                  Upgrade to Pro
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Generator form */}
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

      {isGenerating ? (
        <div className="flex items-center gap-3 text-sm text-[var(--muted)]">
          <div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          Generating with Claude… (~10 seconds)
        </div>
      ) : (
        <Button onClick={handleGenerate} disabled={!selectedResumeId}>
          Generate
        </Button>
      )}

      {generateError && <p className="text-sm text-[var(--destructive)]">{generateError}</p>}

      {result && (
        <div className="space-y-4">
          <ResultCard
            label="Headline"
            content={result.headline}
            charLimit={220}
            editHref="https://www.linkedin.com/in/edit/intro/"
            multiline={false}
          />
          <ResultCard
            label="About Section"
            content={result.summary}
            charLimit={2600}
            editHref="https://www.linkedin.com/in/edit/about/"
            multiline
          />
        </div>
      )}
    </div>
  );
}

function ResultCard({
  label,
  content,
  charLimit,
  editHref,
  multiline,
}: {
  label: string;
  content: string;
  charLimit: number;
  editHref: string;
  multiline: boolean;
}) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">{label}</p>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--muted)]">
            {content.length}/{charLimit} chars
          </span>
          <CopyButton text={content} />
        </div>
      </div>

      {multiline ? (
        <pre className="text-sm text-[var(--foreground)] whitespace-pre-wrap font-sans leading-relaxed overflow-auto max-h-[40vh] mb-4">
          {content}
        </pre>
      ) : (
        <p className="text-sm text-[var(--foreground)] mb-4">{content}</p>
      )}

      <a
        href={editHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
      >
        <ExternalLink size={12} />
        Edit on LinkedIn
      </a>
    </div>
  );
}
