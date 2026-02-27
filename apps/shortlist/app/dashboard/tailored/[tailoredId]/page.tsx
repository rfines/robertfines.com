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
import { CoverLetterSection } from "@/components/tailoring/cover-letter-section";
import { VariationTabs } from "@/components/tailoring/variation-tabs";
import { DownloadMenu } from "@/components/tailoring/download-menu";
import { CopyButton } from "@/components/tailoring/copy-button";
import { KeywordMatchCard } from "@/components/tailoring/keyword-match-card";
import { ResumeDiffView } from "@/components/tailoring/resume-diff-view";
import { canDownload } from "@/lib/plan";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

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
      include: { resume: { select: { title: true, id: true, rawText: true } } },
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
              <Link href={`/dashboard/resumes/${tailored.resume.id}/tailor?from=${tailored.id}`}>
                <Button size="sm" variant="outline">
                  <RefreshCw size={13} />
                  Re-tailor
                </Button>
              </Link>
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
          baseResumeText={tailored.resume.rawText}
        />
      ) : (
        <>
          {keywordMatch && <KeywordMatchCard keywordMatch={keywordMatch} />}

          <ResumeDiffView
            baseText={tailored.resume.rawText}
            tailoredText={tailored.tailoredText}
            plan={plan}
          />

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
        plan={plan}
      />
    </div>
  );
}
