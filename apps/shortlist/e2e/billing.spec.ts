import { type Page } from "@playwright/test";
import { test, expect } from "./fixtures";
import { resetTestUser, setTestUserPlan } from "./helpers";

const STARTER_PRICE_ID = process.env.STRIPE_STARTER_PRICE_ID ?? "price_starter_test";
const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID ?? "price_pro_test";
const AGENCY_PRICE_ID = process.env.STRIPE_AGENCY_PRICE_ID ?? "price_agency_test";

// Mock the checkout API to capture priceId and redirect locally
async function mockCheckout(page: Page) {
  let capturedPriceId = "";
  await page.route("/api/stripe/checkout", async (route) => {
    const body = JSON.parse(route.request().postData() ?? "{}");
    capturedPriceId = body.priceId;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ url: "/dashboard/billing?success=true" }),
    });
  });
  return { getCapturedPriceId: () => capturedPriceId };
}

test.describe("Free plan billing page", () => {
  test.beforeEach(async () => {
    await resetTestUser();
  });

  test("shows Free as current plan", async ({ page }) => {
    await page.goto("/dashboard/billing");
    await expect(page.getByRole("heading", { name: "Billing" })).toBeVisible();
    // The current plan section shows the plan label
    await expect(page.getByText("Free").first()).toBeVisible();
    await expect(page.getByText("Current plan")).toBeVisible();
  });

  test("shows all three paid tiers as upgrade options", async ({ page }) => {
    await page.goto("/dashboard/billing");
    await expect(page.getByRole("button", { name: "Upgrade to Starter" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Upgrade to Pro" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Upgrade to Agency" })).toBeVisible();
  });

  test("does not show a Free tier change option", async ({ page }) => {
    await page.goto("/dashboard/billing");
    await expect(page.getByRole("button", { name: /upgrade to free/i })).not.toBeVisible();
    await expect(page.getByRole("button", { name: /downgrade to free/i })).not.toBeVisible();
  });

  test("shows 'Upgrade your plan' heading for free users", async ({ page }) => {
    await page.goto("/dashboard/billing");
    await expect(page.getByText("Upgrade your plan")).toBeVisible();
  });
});

test.describe("Upgrade from free plan", () => {
  test.beforeEach(async () => {
    await resetTestUser();
  });

  test("upgrade to Starter sends correct priceId and shows success banner", async ({ page }) => {
    const { getCapturedPriceId } = await mockCheckout(page);
    await page.goto("/dashboard/billing");
    await page.getByRole("button", { name: "Upgrade to Starter" }).click();
    await page.waitForURL(/\/dashboard\/billing\?success=true/);
    expect(getCapturedPriceId()).toBe(STARTER_PRICE_ID);
    await expect(page.getByText(/you're now on the/i)).toBeVisible();
  });

  test("upgrade to Pro sends correct priceId", async ({ page }) => {
    const { getCapturedPriceId } = await mockCheckout(page);
    await page.goto("/dashboard/billing");
    await page.getByRole("button", { name: "Upgrade to Pro" }).click();
    await page.waitForURL(/\/dashboard\/billing\?success=true/);
    expect(getCapturedPriceId()).toBe(PRO_PRICE_ID);
  });

  test("upgrade to Agency sends correct priceId", async ({ page }) => {
    const { getCapturedPriceId } = await mockCheckout(page);
    await page.goto("/dashboard/billing");
    await page.getByRole("button", { name: "Upgrade to Agency" }).click();
    await page.waitForURL(/\/dashboard\/billing\?success=true/);
    expect(getCapturedPriceId()).toBe(AGENCY_PRICE_ID);
  });
});

test.describe("Upgrade between paid plans (existing subscriber)", () => {
  test.beforeEach(async () => {
    await setTestUserPlan("starter", {
      stripeSubscriptionId: "sub_e2e_test",
      stripeCustomerId: "cus_e2e_test",
    });
  });

  test("shows Starter as current plan", async ({ page }) => {
    await page.goto("/dashboard/billing");
    await expect(page.getByText("Starter").first()).toBeVisible();
    await expect(page.getByText("Current plan")).toBeVisible();
  });

  test("shows Pro and Agency as upgrade options but not Starter or Free", async ({ page }) => {
    await page.goto("/dashboard/billing");
    await expect(page.getByRole("button", { name: "Upgrade to Pro" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Upgrade to Agency" })).toBeVisible();
    await expect(page.getByRole("button", { name: /starter/i })).not.toBeVisible();
    await expect(page.getByRole("button", { name: /upgrade to free/i })).not.toBeVisible();
  });

  test("shows 'Change your plan' heading for paid subscribers", async ({ page }) => {
    await page.goto("/dashboard/billing");
    await expect(page.getByText("Change your plan")).toBeVisible();
  });

  test("upgrade to Pro sends correct priceId and shows Pro in success banner", async ({
    page,
  }) => {
    const { getCapturedPriceId } = await mockCheckout(page);
    await page.goto("/dashboard/billing");
    await page.getByRole("button", { name: "Upgrade to Pro" }).click();
    await page.waitForURL(/\/dashboard\/billing\?success=true/);
    expect(getCapturedPriceId()).toBe(PRO_PRICE_ID);
    await expect(page.getByText(/you're now on the/i)).toBeVisible();
    await expect(page.getByText(/pro/i).last()).toBeVisible();
  });
});

test.describe("Downgrade between paid plans", () => {
  test("Pro plan shows Starter as downgrade option and Agency as upgrade", async ({ page }) => {
    await setTestUserPlan("pro", {
      stripeSubscriptionId: "sub_e2e_pro",
      stripeCustomerId: "cus_e2e_pro",
    });
    await page.goto("/dashboard/billing");
    await expect(page.getByRole("button", { name: "Downgrade to Starter" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Upgrade to Agency" })).toBeVisible();
  });

  test("downgrade from Pro to Starter sends correct priceId", async ({ page }) => {
    await setTestUserPlan("pro", {
      stripeSubscriptionId: "sub_e2e_pro",
      stripeCustomerId: "cus_e2e_pro",
    });
    const { getCapturedPriceId } = await mockCheckout(page);
    await page.goto("/dashboard/billing");
    await page.getByRole("button", { name: "Downgrade to Starter" }).click();
    await page.waitForURL(/\/dashboard\/billing\?success=true/);
    expect(getCapturedPriceId()).toBe(STARTER_PRICE_ID);
  });

  test("Agency plan shows Starter and Pro as downgrade options", async ({ page }) => {
    await setTestUserPlan("agency", {
      stripeSubscriptionId: "sub_e2e_agency",
      stripeCustomerId: "cus_e2e_agency",
    });
    await page.goto("/dashboard/billing");
    await expect(page.getByRole("button", { name: "Downgrade to Starter" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Downgrade to Pro" })).toBeVisible();
  });

  test("downgrade from Agency to Pro sends correct priceId", async ({ page }) => {
    await setTestUserPlan("agency", {
      stripeSubscriptionId: "sub_e2e_agency",
      stripeCustomerId: "cus_e2e_agency",
    });
    const { getCapturedPriceId } = await mockCheckout(page);
    await page.goto("/dashboard/billing");
    await page.getByRole("button", { name: "Downgrade to Pro" }).click();
    await page.waitForURL(/\/dashboard\/billing\?success=true/);
    expect(getCapturedPriceId()).toBe(PRO_PRICE_ID);
  });
});

test.describe("Success banner", () => {
  test.beforeEach(async () => {
    await resetTestUser();
  });

  test("shows success banner with plan name when ?success=true", async ({ page }) => {
    // Set user to starter so the banner reads "Starter plan"
    await setTestUserPlan("starter", {
      stripeSubscriptionId: "sub_e2e_banner",
      stripeCustomerId: "cus_e2e_banner",
    });
    await page.goto("/dashboard/billing?success=true");
    await expect(page.getByText(/you're now on the/i)).toBeVisible();
    await expect(page.getByText(/starter/i).first()).toBeVisible();
    await expect(page.getByText(/enjoy your new features/i)).toBeVisible();
  });

  test("does not show success banner without ?success param", async ({ page }) => {
    await page.goto("/dashboard/billing");
    await expect(page.getByText(/you're now on the/i)).not.toBeVisible();
  });
});
