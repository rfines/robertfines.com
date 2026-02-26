import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserPlan } from "@/lib/get-user-plan";
import { PageHeader } from "@/components/shared/page-header";
import { TailorForm } from "@/components/tailoring/tailor-form";

interface Props {
  params: Promise<{ resumeId: string }>;
}

export default async function TailorPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const { resumeId } = await params;
  const [resume, plan] = await Promise.all([
    prisma.resume.findFirst({
      where: { id: resumeId, userId: session.user.id },
      select: { id: true, title: true },
    }),
    getUserPlan(session.user.id),
  ]);

  if (!resume) notFound();

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Tailor Resume"
        description="Paste a job description and Claude will tailor your resume to match."
      />
      <TailorForm resumeId={resume.id} resumeTitle={resume.title} plan={plan} />
    </div>
  );
}
