export const PLAN_PRICING = {
  free:    { label: "Free",    price: "$0",     period: "",    description: "Get started with AI resume tailoring" },
  starter: { label: "Starter", price: "$9.99",  period: "/mo", description: "More variations and export options" },
  pro:     { label: "Pro",     price: "$19.99", period: "/mo", description: "Everything you need to land the role" },
  agency:  { label: "Agency",  price: "$49.99", period: "/mo", description: "For talent acquisition professionals" },
} as const;

export const PLAN_LIMITS = {
  free:    { variations: 1, monthlyRuns: 10 },
  starter: { variations: 2, monthlyRuns: 100 },
  pro:     { variations: 3, monthlyRuns: null }, // null = unlimited
  agency:  { variations: 5, monthlyRuns: null }, // null = unlimited, max variations
} as const;

export type Plan = keyof typeof PLAN_LIMITS;

/**
 * Returns the effective monthly run limit for a user.
 * A per-user admin override takes precedence over the plan default.
 * null means unlimited.
 */
export function getEffectiveMonthlyLimit(
  plan: Plan,
  userOverride: number | null
): number | null {
  if (userOverride !== null) return userOverride;
  return PLAN_LIMITS[plan].monthlyRuns;
}

export const PLANS = ["free", "starter", "pro", "agency"] as const;

export function isPlan(value: unknown): value is Plan {
  return PLANS.includes(value as Plan);
}

export function canUseInstructions(plan: Plan): boolean {
  return plan !== "free";
}

export function canExportMarkdown(plan: Plan): boolean {
  return plan !== "free";
}

export function canExportPdf(plan: Plan): boolean {
  return plan === "pro" || plan === "agency";
}

export function canDownload(plan: Plan): boolean {
  return plan !== "free";
}

export function canLabelCandidates(plan: Plan): boolean {
  return plan === "agency";
}

export function planFromPriceId(priceId: string): Plan | null {
  if (priceId === process.env.STRIPE_STARTER_PRICE_ID) return "starter";
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return "pro";
  if (priceId === process.env.STRIPE_AGENCY_PRICE_ID) return "agency";
  return null;
}
