import { test, expect } from "@playwright/test";

test.describe("Landing page (unauthenticated)", () => {
  test("renders the Shortlist heading", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /shortlist/i })).toBeVisible();
  });

  test("shows a sign-in link or button on the landing page", async ({ page }) => {
    await page.goto("/");
    // Either a link or button referencing sign in / get started / google
    const signInEl = page.getByRole("link", { name: /sign in|get started/i }).or(
      page.getByRole("button", { name: /sign in|get started/i })
    );
    await expect(signInEl.first()).toBeVisible();
  });

  test("visiting /dashboard redirects to /auth/signin", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/auth\/signin/);
  });

  test("/auth/signin shows Google sign-in option", async ({ page }) => {
    await page.goto("/auth/signin");
    await expect(
      page.getByRole("button", { name: /google/i }).or(
        page.getByText(/continue with google/i)
      )
    ).toBeVisible();
  });
});
