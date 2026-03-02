import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { defineConfig, devices } from "@playwright/test";

// Load .env.local so DATABASE_URL_E2E and AUTH_SECRET are available for the
// webServer env config below. process.env vars take precedence.
const envPath = resolve(__dirname, ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    if (key && val && !(key in process.env)) process.env[key] = val;
  }
}

export default defineConfig({
  testDir: "./e2e",
  // Use a CJS-compatible tsconfig — the main tsconfig sets module:esnext /
  // moduleResolution:bundler which causes Playwright 1.46+ to activate ESM mode
  // and fail with "exports is not defined in ES module scope".
  tsconfig: "./tsconfig.playwright.json",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      // Ensure the dev server uses the same secret as the e2e auth fixture
      AUTH_SECRET: process.env.AUTH_SECRET ?? "test-secret-32-chars-minimum!!x",
      // Point the dev server at Neon so it doesn't need Railway internal networking
      ...(process.env.DATABASE_URL_E2E
        ? { DATABASE_URL: process.env.DATABASE_URL_E2E }
        : {}),
    },
  },
});
