import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    exclude: ["e2e/**", "**/node_modules/**"],
    setupFiles: ["./vitest.setup.ts"],
    environmentMatchGlobs: [
      ["**/__tests__/components/**", "jsdom"],
      ["**/__tests__/unit/**", "node"],
      ["**/__tests__/api/**", "node"],
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["lib/**", "app/api/**", "components/**", "types/**"],
      exclude: [
        "lib/prisma.ts",
        "lib/anthropic.ts",
        "**/*.d.ts",
        "**/node_modules/**",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
