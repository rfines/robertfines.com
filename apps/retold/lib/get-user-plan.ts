import { cache } from "react";
import { prisma } from "./prisma";
import { type Plan, isPlan } from "./plan";

export const getUserPlan = cache(async (userId: string): Promise<Plan> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });
  const plan = user?.plan;
  return isPlan(plan) ? plan : "free";
});
