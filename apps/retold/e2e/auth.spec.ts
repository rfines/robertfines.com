import { test, expect } from "@playwright/test";

test.describe("Sign-in page", () => {
  test("renders all three OAuth provider buttons", async ({ page }) => {
    await page.goto("/auth/signin");
    await expect(page.getByRole("button", { name: /continue with google/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /continue with github/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /continue with linkedin/i })).toBeVisible();
  });

  test("shows access denied message for AccessDenied error", async ({ page }) => {
    await page.goto("/auth/signin?error=AccessDenied");
    await expect(page.getByText(/access denied/i)).toBeVisible();
    await expect(page.getByText(/contact the administrator/i)).toBeVisible();
  });

  test("shows generic error message for unknown error codes", async ({ page }) => {
    await page.goto("/auth/signin?error=OAuthSignin");
    await expect(page.getByText(/something went wrong/i)).toBeVisible();
  });

  test("unauthenticated visit to /dashboard redirects to sign-in", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/auth\/signin/);
  });

  test("page title and heading are present", async ({ page }) => {
    await page.goto("/auth/signin");
    await expect(page.getByRole("heading", { name: /welcome to retold/i })).toBeVisible();
  });
});
