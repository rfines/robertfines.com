import { test, expect } from "./fixtures";

test.describe("Resumes (authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    // Mock the resumes API so we don't need a real DB
    await page.route("/api/resumes", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
      } else {
        await route.continue();
      }
    });
  });

  test("dashboard is accessible when authenticated", async ({ page }) => {
    await page.goto("/dashboard");
    // Should not redirect to /auth/signin
    await expect(page).not.toHaveURL(/\/auth\/signin/);
  });

  test("resumes list page shows empty state when no resumes", async ({ page }) => {
    await page.goto("/dashboard/resumes");
    // Empty state should have a link to create a new resume
    await expect(
      page.getByRole("link", { name: /add resume|new resume/i }).or(
        page.getByText(/no resumes/i)
      )
    ).toBeVisible();
  });

  test("navigating to new resume page shows the form", async ({ page }) => {
    await page.goto("/dashboard/resumes/new");
    await expect(page.getByLabelText(/resume title/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /paste text/i }).or(
        page.getByRole("button", { name: /upload file/i })
      )
    ).toBeVisible();
  });

  test("submitting the text form creates a resume and navigates to detail page", async ({
    page,
  }) => {
    const createdId = "r_e2e_test";

    // Mock the POST /api/resumes endpoint
    await page.route("/api/resumes", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            id: createdId,
            title: "E2E Test Resume",
            rawText: "Test resume content",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Mock the resume detail GET
    await page.route(`/api/resumes/${createdId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: createdId,
          title: "E2E Test Resume",
          rawText: "Test resume content",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      });
    });

    await page.goto("/dashboard/resumes/new");
    await page.getByLabelText(/resume title/i).fill("E2E Test Resume");
    await page.getByLabelText(/resume content/i).fill("Test resume content");
    await page.getByRole("button", { name: /save resume/i }).click();

    await expect(page).toHaveURL(`/dashboard/resumes/${createdId}`);
  });
});
