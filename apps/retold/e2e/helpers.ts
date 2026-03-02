import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { PrismaClient } from "@prisma/client";

// Load .env.local so DATABASE_URL and other vars are available in the test process.
// Vars already set in the process environment (e.g. via Railway CLI) take precedence.
// process.cwd() is apps/retold when Playwright runs from the package root.
const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (key && value && !(key in process.env)) process.env[key] = value;
  }
}

// Allow overriding the DB URL for local e2e runs (railway.internal is not
// reachable from localhost; set DATABASE_URL_E2E to the public TCP proxy URL
// or a local Postgres URL obtained via `railway connect Postgres`).
if (process.env.DATABASE_URL_E2E) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_E2E;
}

const prisma = new PrismaClient();
export const TEST_USER_ID = "user_test123";

export async function setTestUserPlan(
  plan: string,
  opts?: {
    stripeSubscriptionId?: string | null;
    stripeCustomerId?: string | null;
  }
) {
  await prisma.user.upsert({
    where: { id: TEST_USER_ID },
    update: {
      plan,
      stripeSubscriptionId: opts?.stripeSubscriptionId ?? null,
      stripeCustomerId: opts?.stripeCustomerId ?? null,
      marketingConsent: true,
    },
    create: {
      id: TEST_USER_ID,
      name: "Test User",
      email: "test@example.com",
      plan,
      stripeSubscriptionId: opts?.stripeSubscriptionId ?? null,
      stripeCustomerId: opts?.stripeCustomerId ?? null,
      marketingConsent: true,
    },
  });
}

export async function resetTestUser() {
  await prisma.user.upsert({
    where: { id: TEST_USER_ID },
    update: {
      plan: "free",
      stripeSubscriptionId: null,
      stripeCustomerId: null,
      marketingConsent: true,
    },
    create: {
      id: TEST_USER_ID,
      name: "Test User",
      email: "test@example.com",
      plan: "free",
      marketingConsent: true,
    },
  });
}
