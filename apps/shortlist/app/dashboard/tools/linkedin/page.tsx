import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserPlan } from "@/lib/get-user-plan";
import { canConnectLinkedIn } from "@/lib/plan";
import { LINKEDIN_STALENESS_DAYS } from "@/lib/constants";
import { PageHeader } from "@/components/shared/page-header";
import { LinkedInOptimizerForm } from "./linkedin-optimizer-form";

export default async function LinkedInOptimizerPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const params = await searchParams;

  const [resumes, plan, connection] = await Promise.all([
    prisma.resume.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, rawText: true },
    }),
    getUserPlan(session.user.id),
    prisma.linkedInConnection.findUnique({
      where: { userId: session.user.id },
      select: {
        linkedInId: true,
        cachedName: true,
        cachedHeadline: true,
        cachedPictureUrl: true,
        lastImportedAt: true,
      },
    }),
  ]);

  // Compute staleness on the server — only pass a boolean to the client
  const isStale =
    connection?.lastImportedAt != null &&
    Date.now() - connection.lastImportedAt.getTime() >
      LINKEDIN_STALENESS_DAYS * 24 * 60 * 60 * 1000;

  // Minimal shape exposed to the client
  const linkedInStatus = connection
    ? {
        connected: true as const,
        name: connection.cachedName,
        headline: connection.cachedHeadline,
        pictureUrl: connection.cachedPictureUrl,
        isStale,
        canConnect: canConnectLinkedIn(plan),
      }
    : {
        connected: false as const,
        canConnect: canConnectLinkedIn(plan),
      };

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="LinkedIn Optimizer"
        description="Generate a compelling LinkedIn headline and About section from your resume."
      />
      <LinkedInOptimizerForm
        resumes={resumes}
        plan={plan}
        linkedInStatus={linkedInStatus}
        flashConnected={params.connected === "true"}
        flashError={params.error === "linkedin_connect"}
      />
    </div>
  );
}
