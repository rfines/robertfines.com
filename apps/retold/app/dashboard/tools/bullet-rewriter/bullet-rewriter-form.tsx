"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CopyButton } from "@/components/tailoring/copy-button";
import type { Plan } from "@/lib/plan";
import { canUseBulletRewriter } from "@/lib/plan";

interface BulletRewriterFormProps {
  plan: Plan;
}

export function BulletRewriterForm({ plan }: BulletRewriterFormProps) {
  const locked = !canUseBulletRewriter(plan);
  const [bullet, setBullet] = useState("");
  const [rewrites, setRewrites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRewrite() {
    if (!bullet.trim() || isLoading) return;
    setIsLoading(true);
    setError(null);
    setRewrites([]);
    try {
      const res = await fetch("/api/tools/bullet-rewriter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bullet: bullet.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Rewrite failed");
      setRewrites(data.rewrites);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  if (locked) {
    return (
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 flex items-start gap-4">
        <Lock size={16} className="text-[var(--muted)] mt-0.5 shrink-0" />
        <div>
          <p className="text-sm text-[var(--foreground)] font-medium mb-1">
            Bullet Rewriter is available on Starter and above
          </p>
          <p className="text-xs text-[var(--muted)] mb-3">
            Upgrade to get three AI-powered rewrites for any bullet point — stronger verbs, better
            specificity, more impact.
          </p>
          <Link href="/dashboard/billing">
            <Button size="sm">Upgrade to Starter</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="bullet">Original bullet point</Label>
        <Textarea
          id="bullet"
          placeholder="e.g. Worked on backend systems to improve performance"
          value={bullet}
          onChange={(e) => setBullet(e.target.value)}
          className="min-h-[100px] mt-1.5"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center gap-3 text-sm text-[var(--muted)]">
          <div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          Rewriting with Claude… (~5 seconds)
        </div>
      ) : (
        <Button onClick={handleRewrite} disabled={!bullet.trim()}>
          Rewrite
        </Button>
      )}

      {error && <p className="text-sm text-[var(--destructive)]">{error}</p>}

      {rewrites.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-[var(--foreground)]">Rewrites</p>
          {rewrites.map((r, i) => (
            <div
              key={i}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 flex items-start justify-between gap-4"
            >
              <p className="text-sm text-[var(--foreground)] leading-relaxed">{r}</p>
              <CopyButton text={r} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
