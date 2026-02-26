import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { ResumeDeleteButton } from "@/components/resumes/resume-delete-button";
import { Sparkles, AlertTriangle, CheckCircle } from "lucide-react";
import { analyzeAtsWarnings } from "@/lib/ats-warnings";

interface Props {
  params: Promise<{ resumeId: string }>;
}

export default async function ResumePage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const { resumeId } = await params;
  const resume = await prisma.resume.findFirst({
    where: { id: resumeId, userId: session.user.id },
    include: {
      tailoredResumes: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          jobTitle: true,
          company: true,
          intensity: true,
          createdAt: true,
        },
      },
    },
  });

  if (!resume) notFound();

  const atsWarnings = analyzeAtsWarnings(resume.rawText);

  const updatedAt = resume.updatedAt.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={resume.title}
        description={`Last updated ${updatedAt}`}
        action={
          <div className="flex items-center gap-2">
            <ResumeDeleteButton resumeId={resume.id} />
            <Link href={`/dashboard/resumes/${resume.id}/tailor`}>
              <Button size="sm">
                <Sparkles size={14} />
                Tailor for a job
              </Button>
            </Link>
          </div>
        }
      />

      {resume.fileType && (
        <Badge variant="muted" className="mb-4">
          {resume.fileType.toUpperCase()} source
        </Badge>
      )}

      {/* ATS Warnings */}
      {atsWarnings.length === 0 ? (
        <div className="flex items-center gap-2 text-xs text-green-400 mb-4">
          <CheckCircle size={14} />
          No ATS formatting issues detected
        </div>
      ) : (
        <details className="mb-4">
          <summary className="cursor-pointer flex items-center gap-2 text-xs text-yellow-400 hover:text-[var(--foreground)] transition-colors select-none">
            <AlertTriangle size={14} />
            {atsWarnings.length} ATS formatting {atsWarnings.length === 1 ? "issue" : "issues"} detected — click to expand
          </summary>
          <div className="mt-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl divide-y divide-[var(--border)]">
            {atsWarnings.map((warning) => (
              <div key={warning.code} className="p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle
                    size={13}
                    className={
                      warning.severity === "error"
                        ? "text-[var(--destructive)] mt-0.5 shrink-0"
                        : "text-yellow-400 mt-0.5 shrink-0"
                    }
                  />
                  <div>
                    <p
                      className={`text-xs font-medium ${
                        warning.severity === "error"
                          ? "text-[var(--destructive)]"
                          : "text-yellow-400"
                      }`}
                    >
                      {warning.message}
                    </p>
                    {warning.detail && (
                      <p className="text-xs text-[var(--muted)] mt-0.5">
                        {warning.detail}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
        <pre className="text-xs text-[var(--foreground)] whitespace-pre-wrap font-mono leading-relaxed overflow-auto max-h-[60vh]">
          {resume.rawText}
        </pre>
      </div>

      {/* Tailoring History */}
      {resume.tailoredResumes.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">
            Tailored Versions ({resume.tailoredResumes.length})
          </h2>
          <div className="space-y-2">
            {resume.tailoredResumes.map((tr) => {
              const date = tr.createdAt.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              return (
                <Link
                  key={tr.id}
                  href={`/dashboard/tailored/${tr.id}`}
                  className="flex items-center justify-between gap-4 p-3 rounded-lg border border-[var(--border)] hover:border-[var(--accent)]/50 transition-colors bg-[var(--surface)]"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-[var(--foreground)] truncate">
                      {tr.jobTitle}
                      {tr.company ? ` — ${tr.company}` : ""}
                    </p>
                    <p className="text-xs text-[var(--muted)] mt-0.5">{date}</p>
                  </div>
                  {tr.intensity && (
                    <Badge variant="muted" className="shrink-0 capitalize">
                      {tr.intensity}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
