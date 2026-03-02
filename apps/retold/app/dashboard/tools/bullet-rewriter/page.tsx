import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserPlan } from "@/lib/get-user-plan";
import { PageHeader } from "@/components/shared/page-header";
import { BulletRewriterForm } from "./bullet-rewriter-form";

export default async function BulletRewriterPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const plan = await getUserPlan(session.user.id);

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="Bullet Rewriter"
        description="Paste a resume bullet point and get three stronger, more impactful rewrites."
      />
      <BulletRewriterForm plan={plan} />
    </div>
  );
}
