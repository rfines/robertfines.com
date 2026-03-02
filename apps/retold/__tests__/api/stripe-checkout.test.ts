import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/stripe", () => ({
  getStripe: vi.fn(),
}));

import { POST } from "@/app/api/stripe/checkout/route";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

const AUTHED_SESSION = {
  user: { id: "user_test123", email: "test@example.com" },
  expires: "2099-01-01",
};

const STARTER_PRICE_ID = "price_starter_test";

const mockCustomersCreate = vi.fn();
const mockSessionsCreate = vi.fn();
const mockSubscriptionsRetrieve = vi.fn();
const mockSubscriptionsUpdate = vi.fn();

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/stripe/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("STRIPE_STARTER_PRICE_ID", "price_starter_test");
    vi.stubEnv("STRIPE_PRO_PRICE_ID", "price_pro_test");
    vi.stubEnv("STRIPE_AGENCY_PRICE_ID", "price_agency_test");
    vi.stubEnv("NEXTAUTH_URL", "https://retold.dev");

    vi.mocked(getStripe).mockReturnValue({
      customers: { create: mockCustomersCreate },
      checkout: { sessions: { create: mockSessionsCreate } },
      subscriptions: {
        retrieve: mockSubscriptionsRetrieve,
        update: mockSubscriptionsUpdate,
      },
    } as never);

    vi.mocked(auth).mockResolvedValue(AUTHED_SESSION as never);
    // Default: no existing subscription (new subscriber)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      email: "test@example.com",
      stripeCustomerId: "cus_existing123",
      stripeSubscriptionId: null,
    } as never);
    mockSessionsCreate.mockResolvedValue({
      url: "https://checkout.stripe.com/pay/cs_test_123",
    });
  });

  // ── Auth & validation ──────────────────────────────────────────────────────

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const res = await POST(makeRequest({ priceId: STARTER_PRICE_ID }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when priceId is missing", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 400 for an unrecognized priceId", async () => {
    const res = await POST(makeRequest({ priceId: "price_unknown_xyz" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid price ID");
  });

  it("returns 404 when user is not found in database", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null as never);
    const res = await POST(makeRequest({ priceId: STARTER_PRICE_ID }));
    expect(res.status).toBe(404);
  });

  // ── New subscription (no existing subscription) ───────────────────────────

  it("reuses existing Stripe customer without creating a new one", async () => {
    await POST(makeRequest({ priceId: STARTER_PRICE_ID }));
    expect(mockCustomersCreate).not.toHaveBeenCalled();
    expect(mockSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_existing123" })
    );
  });

  it("creates a new Stripe customer when the user has no customerId", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      email: "test@example.com",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
    } as never);
    mockCustomersCreate.mockResolvedValue({ id: "cus_new456" });

    await POST(makeRequest({ priceId: STARTER_PRICE_ID }));

    expect(mockCustomersCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "test@example.com",
        metadata: { userId: "user_test123" },
      })
    );
  });

  it("saves the new Stripe customer ID to the database", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      email: "test@example.com",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
    } as never);
    mockCustomersCreate.mockResolvedValue({ id: "cus_new456" });

    await POST(makeRequest({ priceId: STARTER_PRICE_ID }));

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user_test123" },
      data: { stripeCustomerId: "cus_new456" },
    });
  });

  it("creates a subscription checkout session with the correct price and metadata", async () => {
    await POST(makeRequest({ priceId: STARTER_PRICE_ID }));
    expect(mockSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "subscription",
        line_items: [{ price: STARTER_PRICE_ID, quantity: 1 }],
        metadata: { userId: "user_test123" },
      })
    );
  });

  it("returns the Stripe checkout session URL for a new subscription", async () => {
    const res = await POST(makeRequest({ priceId: STARTER_PRICE_ID }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.url).toBe("https://checkout.stripe.com/pay/cs_test_123");
  });

  it("accepts the pro price ID", async () => {
    const res = await POST(makeRequest({ priceId: "price_pro_test" }));
    expect(res.status).toBe(200);
  });

  it("accepts the agency price ID", async () => {
    const res = await POST(makeRequest({ priceId: "price_agency_test" }));
    expect(res.status).toBe(200);
  });

  // ── Plan change (existing subscription) ───────────────────────────────────

  beforeEach(() => {
    mockSubscriptionsRetrieve.mockResolvedValue({
      items: { data: [{ id: "si_item123" }] },
    });
    mockSubscriptionsUpdate.mockResolvedValue({});
  });

  it("updates the existing subscription instead of creating a new checkout session", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      email: "test@example.com",
      stripeCustomerId: "cus_existing123",
      stripeSubscriptionId: "sub_existing789",
    } as never);

    await POST(makeRequest({ priceId: "price_pro_test" }));

    expect(mockSubscriptionsUpdate).toHaveBeenCalledWith(
      "sub_existing789",
      expect.objectContaining({
        items: [{ id: "si_item123", price: "price_pro_test" }],
        proration_behavior: "create_prorations",
      })
    );
    expect(mockSessionsCreate).not.toHaveBeenCalled();
  });

  it("updates the plan in the database immediately after a plan change", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      email: "test@example.com",
      stripeCustomerId: "cus_existing123",
      stripeSubscriptionId: "sub_existing789",
    } as never);

    await POST(makeRequest({ priceId: "price_pro_test" }));

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user_test123" },
      data: { plan: "pro" },
    });
  });

  it("returns the billing success URL (not a Stripe URL) for a plan change", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      email: "test@example.com",
      stripeCustomerId: "cus_existing123",
      stripeSubscriptionId: "sub_existing789",
    } as never);

    const res = await POST(makeRequest({ priceId: "price_pro_test" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.url).toBe("https://retold.dev/dashboard/billing?success=true");
  });

  it("handles downgrade from pro to starter via subscription update", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      email: "test@example.com",
      stripeCustomerId: "cus_existing123",
      stripeSubscriptionId: "sub_existing789",
    } as never);

    await POST(makeRequest({ priceId: STARTER_PRICE_ID }));

    expect(mockSubscriptionsUpdate).toHaveBeenCalledWith(
      "sub_existing789",
      expect.objectContaining({ items: [{ id: "si_item123", price: STARTER_PRICE_ID }] })
    );
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user_test123" },
      data: { plan: "starter" },
    });
  });
});
