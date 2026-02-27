import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PLAN_PRICING, PLAN_LIMITS, type Plan } from "@/lib/plan";
import { Check, X, CheckCircle2 } from "lucide-react";
import { UpgradeButton } from "@/components/billing/upgrade-button";
import { PortalButton } from "@/components/billing/portal-button";

const planFeatures: {
  label: string;
  free: boolean | string;
  starter: boolean | string;
  pro: boolean | string;
  agency: boolean | string;
}[] = [
  { label: "Tailored resume variations", free: "1", starter: "2", pro: "3", agency: "5" },
  { label: "Monthly tailoring runs",      free: "10", starter: "100", pro: "Unlimited", agency: "Unlimited" },
  { label: "Plain text view + Copy",      free: true, starter: true, pro: true, agency: true },
  { label: "Keyword match score",          free: true, starter: true, pro: true, agency: true },
  { label: "DOCX download",               free: false, starter: true, pro: true, agency: true },
  { label: "Markdown export",             free: false, starter: true, pro: true, agency: true },
  { label: "Custom instructions",         free: false, starter: true, pro: true, agency: true },
  { label: "PDF export",                  free: false, starter: false, pro: true, agency: true },
  { label: "Candidate name labeling",     free: false, starter: false, pro: false, agency: true },
];

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const { success } = await searchParams;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, stripeCustomerId: true },
  });

  const plan = (user?.plan ?? "free") as Plan;
  const hasSubscription = !!user?.stripeCustomerId;

  const allTiers: Plan[] = ["free", "starter", "pro", "agency"];
  const upgradeTiers = allTiers.filter(
    (t) => allTiers.indexOf(t) > allTiers.indexOf(plan)
  );

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-xl font-bold text-[var(--foreground)]">Billing</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Manage your plan and subscription.
        </p>
      </div>

      {success === "true" && (
        <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 rounded-lg px-4 py-3 text-sm">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>
            You&apos;re now on the{" "}
            <span className="font-semibold">{PLAN_PRICING[plan].label}</span> plan.
            Enjoy your new features!
          </span>
        </div>
      )}

      {/* Current plan */}
      <div className="border border-[var(--border)] rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-1">
              Current plan
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold">{PLAN_PRICING[plan].label}</span>
              {PLAN_PRICING[plan].period && (
                <span className="text-sm text-[var(--muted)]">
                  {PLAN_PRICING[plan].price}{PLAN_PRICING[plan].period}
                </span>
              )}
            </div>
          </div>
          <span className="text-xs font-semibold bg-[var(--accent)]/10 text-[var(--accent)] px-3 py-1 rounded-full">
            Active
          </span>
        </div>

        <ul className="space-y-2">
          {planFeatures.map(({ label, [plan]: value }) => {
            const included = value !== false;
            return (
              <li key={label} className="flex items-center gap-2 text-sm">
                {typeof value === "string" ? (
                  <>
                    <Check size={14} className="text-[var(--accent)] shrink-0" />
                    <span>
                      <span className="font-medium">{value}</span>{" "}
                      {label.toLowerCase()}
                    </span>
                  </>
                ) : included ? (
                  <>
                    <Check size={14} className="text-[var(--accent)] shrink-0" />
                    <span>{label}</span>
                  </>
                ) : (
                  <>
                    <X size={14} className="text-[var(--border)] shrink-0" />
                    <span className="text-[var(--muted)]">{label}</span>
                  </>
                )}
              </li>
            );
          })}
        </ul>

        {hasSubscription && (
          <div className="pt-2 border-t border-[var(--border)]">
            <PortalButton />
          </div>
        )}
      </div>

      {/* Upgrade options */}
      {upgradeTiers.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-[var(--foreground)]">Upgrade your plan</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {upgradeTiers.map((tier) => (
              <UpgradeTierCard key={tier} tier={tier} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function UpgradeTierCard({ tier }: { tier: Plan }) {
  const { label, price, period, description } = PLAN_PRICING[tier];
  const { variations } = PLAN_LIMITS[tier];
  const priceId =
    tier === "starter"
      ? process.env.STRIPE_STARTER_PRICE_ID!
      : tier === "pro"
      ? process.env.STRIPE_PRO_PRICE_ID!
      : process.env.STRIPE_AGENCY_PRICE_ID!;

  const highlights =
    tier === "starter"
      ? [`${variations} tailored variations`, "100 tailoring runs/month", "DOCX + Markdown export", "Custom instructions"]
      : tier === "pro"
      ? [`${variations} tailored variations`, "Unlimited tailoring runs", "All export formats + PDF", "Custom instructions"]
      : [`${variations} tailored variations`, "Unlimited tailoring runs", "All export formats + PDF", "Candidate name labeling"];

  return (
    <div className="border border-[var(--border)] rounded-xl p-5 flex flex-col gap-4 bg-[var(--surface)]">
      <div>
        <p className="text-sm font-semibold text-[var(--muted)] mb-0.5">{label}</p>
        <div className="flex items-baseline gap-0.5">
          <span className="text-2xl font-bold">{price}</span>
          <span className="text-sm text-[var(--muted)]">{period}</span>
        </div>
        <p className="text-xs text-[var(--muted)] mt-1">{description}</p>
      </div>
      <ul className="space-y-1.5 flex-1">
        {highlights.map((h) => (
          <li key={h} className="flex items-center gap-2 text-sm">
            <Check size={13} className="text-[var(--accent)] shrink-0" />
            <span>{h}</span>
          </li>
        ))}
      </ul>
      <UpgradeButton priceId={priceId} label={label} featured={tier === "starter"} />
    </div>
  );
}
