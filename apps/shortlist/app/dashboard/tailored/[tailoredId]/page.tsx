import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TailoredDeleteButton } from "@/components/tailoring/tailored-delete-button";
import Link from "next/link";
import { Download, ArrowLeft } from "lucide-react";

interface Props {
  params: Promise<{ tailoredId: string }>;
}

export default async function TailoredResumePage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const { tailoredId } = await params;
  const tailored = await prisma.tailoredResume.findFirst({
    where: { id: tailoredId, userId: session.user.id },
    include: { resume: { select: { title: true, id: true } } },
  });

  if (!tailored) notFound();

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
              <a href={`/api/tailored/${tailored.id}/download`} download>
                <Button size="sm">
                  <Download size={14} />
                  Download DOCX
                </Button>
              </a>
            </div>
          }
        />
      </div>

      {tailored.tokensUsed && (
        <Badge variant="muted" className="mb-4">
          {tailored.tokensUsed.toLocaleString()} tokens used
        </Badge>
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
    </div>
  );
}
