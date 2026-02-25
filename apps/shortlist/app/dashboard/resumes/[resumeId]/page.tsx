import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { ResumeDeleteButton } from "@/components/resumes/resume-delete-button";
import { Sparkles } from "lucide-react";

interface Props {
  params: Promise<{ resumeId: string }>;
}

export default async function ResumePage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const { resumeId } = await params;
  const resume = await prisma.resume.findFirst({
    where: { id: resumeId, userId: session.user.id },
  });

  if (!resume) notFound();

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

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
        <pre className="text-xs text-[var(--foreground)] whitespace-pre-wrap font-mono leading-relaxed overflow-auto max-h-[60vh]">
          {resume.rawText}
        </pre>
      </div>
    </div>
  );
}
