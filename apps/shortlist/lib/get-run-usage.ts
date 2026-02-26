import { cache } from "react";
import { prisma } from "./prisma";
import { getUserPlan } from "./get-user-plan";
import { getEffectiveMonthlyLimit } from "./plan";

export interface RunUsage {
  used: number;
  limit: number | null; // null = unlimited
  remaining: number | null; // null = unlimited
}

/**
 * Returns the current month's tailoring run usage for a user.
 * React-cached so it's fetched at most once per request even if called from
 * multiple places (tailor page + dashboard).
 */
export const getRunUsage = cache(async (userId: string): Promise<RunUsage> => {
  const [plan, user] = await Promise.all([
    getUserPlan(userId),
    prisma.user.findUnique({
      where: { id: userId },
      select: { monthlyRunLimit: true },
    }),
  ]);

  const limit = getEffectiveMonthlyLimit(plan, user?.monthlyRunLimit ?? null);

  // No need to query the DB for unlimited users
  if (limit === null) {
    return { used: 0, limit: null, remaining: null };
  }

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const used = await prisma.tailoredResume.count({
    where: {
      userId,
      variationIndex: 0, // one count per session, not per variation
      createdAt: { gte: startOfMonth },
    },
  });

  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
  };
});
