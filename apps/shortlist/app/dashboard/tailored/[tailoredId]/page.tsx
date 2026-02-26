import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserPlan } from "@/lib/get-user-plan";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { TailoredDeleteButton } from "@/components/tailoring/tailored-delete-button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { computeKeywordMatch } from "@/lib/keyword-match";
import { cn } from "@/lib/cn";
import { CoverLetterSection } from "@/components/tailoring/cover-letter-section";
import { VariationTabs } from "@/components/tailoring/variation-tabs";
import { DownloadMenu } from "@/components/tailoring/download-menu";
import { CopyButton } from "@/components/tailoring/copy-button";
import { canDownload } from "@/lib/plan";

interface Props {
  params: Promise<{ tailoredId: string }>;
}

export default async function TailoredResumePage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const { tailoredId } = await params;
  const [tailored, plan] = await Promise.all([
    prisma.tailoredResume.findFirst({
      where: { id: tailoredId, userId: session.user.id },
      include: { resume: { select: { title: true, id: true } } },
    }),
    getUserPlan(session.user.id),
  ]);

  if (!tailored) notFound();

  // Fetch siblings if this belongs to a variation group
  const siblings = tailored.variationGroup
    ? await prisma.tailoredResume.findMany({
        where: { variationGroup: tailored.variationGroup, userId: session.user.id },
        orderBy: { variationIndex: "asc" },
        select: { id: true, variationIndex: true, tailoredText: true },
      })
    : null;

  const hasVariations = siblings && siblings.length > 1;

  const keywordMatch = !hasVariations
    ? computeKeywordMatch(tailored.jobDescription, tailored.tailoredText)
    : null;

  const variationData = hasVariations
    ? siblings.map((s) => ({
        id: s.id,
        variationIndex: s.variationIndex,
        tailoredText: s.tailoredText,
        keywordMatch: computeKeywordMatch(tailored.jobDescription, s.tailoredText),
      }))
    : null;

  const createdAt = tailored.createdAt.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const title = tailored.company
    ? `${tailored.jobTitle} — ${tailored.company}`
    : tailored.jobTitle;

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link
          href="/dashboard/tailored"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors mb-4"
        >
          <ArrowLeft size={12} />
          All tailored resumes
        </Link>
        <PageHeader
          title={title}
          description={`Generated from "${tailored.resume.title}" · ${createdAt}`}
          action={
            <div className="flex items-center gap-2">
              <TailoredDeleteButton tailoredId={tailored.id} />
              {!hasVariations && (
                canDownload(plan)
                  ? <DownloadMenu tailoredId={tailored.id} plan={plan} />
                  : <CopyButton text={tailored.tailoredText} />
              )}
            </div>
          }
        />
      </div>

      <div className="flex items-center gap-2 mb-6">
        {tailored.tokensUsed && (
          <Badge variant="muted">
            {tailored.tokensUsed.toLocaleString()} tokens used
          </Badge>
        )}
        {tailored.intensity && (
          <Badge variant="muted" className="capitalize">
            {tailored.intensity} tailoring
          </Badge>
        )}
      </div>

      {hasVariations && variationData ? (
        <VariationTabs
          variations={variationData}
          activeId={tailoredId}
          plan={plan}
        />
      ) : (
        <>
          {/* Keyword Match Score */}
          {keywordMatch && (
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  Keyword Match
                </span>
                <span
                  className={cn(
                    "text-sm font-bold",
                    keywordMatch.score >= 70
                      ? "text-green-400"
                      : keywordMatch.score >= 45
                        ? "text-yellow-400"
                        : "text-[var(--destructive)]"
                  )}
                >
                  {keywordMatch.score}%
                </span>
                <span className="text-xs text-[var(--muted)]">
                  {keywordMatch.matched.length} / {keywordMatch.total} terms matched
                </span>
              </div>
              <div className="w-full h-1.5 bg-[var(--border)] rounded-full mb-3">
                <div
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    keywordMatch.score >= 70
                      ? "bg-green-400"
                      : keywordMatch.score >= 45
                        ? "bg-yellow-400"
                        : "bg-[var(--destructive)]"
                  )}
                  style={{ width: `${keywordMatch.score}%` }}
                />
              </div>
              <details>
                <summary className="cursor-pointer text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors select-none">
                  View matched &amp; missing terms
                </summary>
                <div className="mt-3 grid grid-cols-2 gap-4">
                  {keywordMatch.matched.length > 0 && (
                    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
                      <p className="text-xs font-medium text-green-400 mb-2">
                        Matched ({keywordMatch.matched.length})
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {keywordMatch.matched.map((term) => (
                          <span
                            key={term}
                            className="text-xs px-2 py-0.5 rounded-full bg-green-400/10 text-green-400"
                          >
                            {term}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {keywordMatch.missing.length > 0 && (
                    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
                      <p className="text-xs font-medium text-[var(--destructive)] mb-2">
                        Missing ({keywordMatch.missing.length})
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {keywordMatch.missing.map((term) => (
                          <span
                            key={term}
                            className="text-xs px-2 py-0.5 rounded-full bg-[var(--destructive)]/10 text-[var(--destructive)]"
                          >
                            {term}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </details>
            </div>
          )}

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 mb-6">
            <pre className="text-xs text-[var(--foreground)] whitespace-pre-wrap font-mono leading-relaxed overflow-auto max-h-[60vh]">
              {tailored.tailoredText}
            </pre>
          </div>

          <details className="group">
            <summary className="cursor-pointer text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors select-none">
              View original job description
            </summary>
            <div className="mt-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
              <pre className="text-xs text-[var(--muted)] whitespace-pre-wrap leading-relaxed overflow-auto max-h-[30vh]">
                {tailored.jobDescription}
              </pre>
            </div>
          </details>
        </>
      )}

      <CoverLetterSection
        tailoredId={tailored.id}
        initialCoverLetterText={tailored.coverLetterText ?? null}
      />
    </div>
  );
}
