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
