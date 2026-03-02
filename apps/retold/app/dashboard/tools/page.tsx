import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserPlan } from "@/lib/get-user-plan";
import { canUseBulletRewriter, canUseLinkedInOptimizer } from "@/lib/plan";
import { PageHeader } from "@/components/shared/page-header";
import Link from "next/link";
import { Pencil, Linkedin, Lock } from "lucide-react";

const tools = [
  {
    href: "/dashboard/tools/bullet-rewriter",
    label: "Bullet Rewriter",
    description:
      "Transform weak resume bullets into powerful, quantified achievements.",
    icon: Pencil,
    gate: canUseBulletRewriter,
  },
  {
    href: "/dashboard/tools/linkedin",
    label: "LinkedIn Optimizer",
    description:
      "Generate a compelling LinkedIn headline and About section from your resume.",
    icon: Linkedin,
    gate: canUseLinkedInOptimizer,
  },
];

export default async function ToolsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const plan = await getUserPlan(session.user.id);

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="Tools"
        description="AI-powered tools to strengthen your job search."
      />
      <div className="grid gap-4">
        {tools.map(({ href, label, description, icon: Icon, gate }) => {
          const locked = !gate(plan);
          return (
            <Link
              key={href}
              href={href}
              className="flex items-start gap-4 rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 transition-all"
            >
              <div className="shrink-0 rounded-lg bg-accent/10 p-2.5 text-accent">
                <Icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-foreground">
                    {label}
                  </h2>
                  {locked && (
                    <Lock size={12} className="text-muted" />
                  )}
                </div>
                <p className="text-sm text-muted mt-0.5">{description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
