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
    } as never);

    vi.mocked(auth).mockResolvedValue(AUTHED_SESSION as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      email: "test@example.com",
      stripeCustomerId: "cus_existing123",
    } as never);
    mockSessionsCreate.mockResolvedValue({
      url: "https://checkout.stripe.com/pay/cs_test_123",
    });
  });

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

  it("returns the checkout session URL", async () => {
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
});
