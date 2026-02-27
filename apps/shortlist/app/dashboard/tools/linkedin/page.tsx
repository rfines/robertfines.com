import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserPlan } from "@/lib/get-user-plan";
import { PageHeader } from "@/components/shared/page-header";
import { LinkedInOptimizerForm } from "./linkedin-optimizer-form";

export default async function LinkedInOptimizerPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const [resumes, plan] = await Promise.all([
    prisma.resume.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, rawText: true },
    }),
    getUserPlan(session.user.id),
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="LinkedIn Optimizer"
        description="Generate a compelling LinkedIn headline and About section from your resume."
      />
      <LinkedInOptimizerForm resumes={resumes} plan={plan} />
    </div>
  );
}
