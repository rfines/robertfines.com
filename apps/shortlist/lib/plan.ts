export const PLAN_PRICING = {
  free:    { label: "Free",    price: "$0",     period: "",    description: "Get started with AI resume tailoring" },
  starter: { label: "Starter", price: "$9.99",  period: "/mo", description: "More variations and export options" },
  pro:     { label: "Pro",     price: "$19.99", period: "/mo", description: "Everything you need to land the role" },
} as const;

export const PLAN_LIMITS = {
  free: { variations: 1 },
  starter: { variations: 2 },
  pro: { variations: 3 },
} as const;

export type Plan = keyof typeof PLAN_LIMITS;

export const PLANS = ["free", "starter", "pro"] as const;

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
  return plan === "pro";
}

export function canDownload(plan: Plan): boolean {
  return plan !== "free";
}

export function planFromPriceId(priceId: string): Plan | null {
  if (priceId === process.env.STRIPE_STARTER_PRICE_ID) return "starter";
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return "pro";
  return null;
}
