import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserPlan } from "@/lib/get-user-plan";
import { getRunUsage } from "@/lib/get-run-usage";
import { PageHeader } from "@/components/shared/page-header";
import { RunUsageBanner } from "@/components/shared/run-usage-banner";
import { TailorForm } from "@/components/tailoring/tailor-form";
import type { Intensity } from "@/types";

interface Props {
  params: Promise<{ resumeId: string }>;
  searchParams: Promise<{ from?: string }>;
}

export default async function TailorPage({ params, searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const { resumeId } = await params;
  const { from } = await searchParams;

  const [resume, plan, usage] = await Promise.all([
    prisma.resume.findFirst({
      where: { id: resumeId, userId: session.user.id },
      select: { id: true, title: true },
    }),
    getUserPlan(session.user.id),
    getRunUsage(session.user.id),
  ]);

  if (!resume) notFound();

  // If re-tailoring from a prior result, fetch its settings
  let initialValues:
    | {
        jobTitle: string;
        company?: string;
        jobDescription: string;
        intensity: Intensity;
        userInstructions?: string;
      }
    | undefined;

  if (from) {
    const prior = await prisma.tailoredResume.findFirst({
      where: { id: from, userId: session.user.id },
      select: {
        jobTitle: true,
        company: true,
        jobDescription: true,
        intensity: true,
        userInstructions: true,
      },
    });
    if (prior) {
      initialValues = {
        jobTitle: prior.jobTitle,
        company: prior.company ?? undefined,
        jobDescription: prior.jobDescription,
        intensity: (prior.intensity as Intensity) ?? "moderate",
        userInstructions: prior.userInstructions ?? undefined,
      };
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <PageHeader
        title="Tailor Resume"
        description="Paste a job description and Claude will tailor your resume to match."
      />
      <RunUsageBanner usage={usage} />
      <TailorForm
        resumeId={resume.id}
        resumeTitle={resume.title}
        plan={plan}
        initialValues={initialValues}
      />
    </div>
  );
}
