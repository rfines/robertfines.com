import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      updateMany: vi.fn(),
      update: vi.fn(),
    },
    processedStripeEvent: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/stripe", () => ({
  getStripe: vi.fn(),
}));

import { GET, POST } from "@/app/api/stripe/webhook/route";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

const WEBHOOK_SECRET = "whsec_test_secret";
const STRIPE_SIG = "t=123456789,v1=abc123";

const mockConstructEvent = vi.fn();

// Minimal Stripe subscription shape used by the handler
function makeSubscription({
  id = "sub_test123",
  customerId = "cus_test123",
  priceId = "price_starter_test",
  status = "active",
}: {
  id?: string;
  customerId?: string;
  priceId?: string;
  status?: string;
} = {}) {
  return {
    id,
    customer: customerId,
    status,
    items: { data: [{ price: { id: priceId } }] },
  };
}

function makeWebhookRequest(body: unknown = {}) {
  return new Request("http://localhost/api/stripe/webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "stripe-signature": STRIPE_SIG,
    },
    body: JSON.stringify(body),
  });
}

describe("GET /api/stripe/webhook", () => {
  it("returns the diagnostic ok response", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
  });
});

describe("POST /api/stripe/webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", WEBHOOK_SECRET);
    vi.stubEnv("STRIPE_STARTER_PRICE_ID", "price_starter_test");
    vi.stubEnv("STRIPE_PRO_PRICE_ID", "price_pro_test");
    vi.stubEnv("STRIPE_AGENCY_PRICE_ID", "price_agency_test");

    vi.mocked(getStripe).mockReturnValue({
      webhooks: { constructEvent: mockConstructEvent },
    } as never);

    vi.mocked(prisma.user.updateMany).mockResolvedValue({ count: 1 } as never);
    vi.mocked(prisma.user.update).mockResolvedValue({} as never);
    // Default: idempotency check succeeds (new event, not a duplicate)
    vi.mocked(prisma.processedStripeEvent.create).mockResolvedValue({} as never);
  });

  // ── Request validation ──────────────────────────────────────────────────────

  it("returns 400 when stripe-signature header is missing", async () => {
    const req = new Request("http://localhost/api/stripe/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Missing stripe-signature");
  });

  it("returns 500 when STRIPE_WEBHOOK_SECRET is not configured", async () => {
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "");
    const res = await POST(makeWebhookRequest());
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("Webhook not configured");
  });

  it("returns 400 when signature verification fails", async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error("No matching signature found");
    });
    const res = await POST(makeWebhookRequest());
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid signature");
  });

  // ── Idempotency ─────────────────────────────────────────────────────────────

  describe("idempotency", () => {
    it("returns 200 without processing when the event has already been handled", async () => {
      mockConstructEvent.mockReturnValue({
        id: "evt_duplicate123",
        type: "customer.subscription.deleted",
        data: { object: makeSubscription() },
      });

      // Simulate unique constraint violation (P2002) — event already exists
      const uniqueError = Object.assign(new Error("Unique constraint failed"), { code: "P2002" });
      vi.mocked(prisma.processedStripeEvent.create).mockRejectedValue(uniqueError);

      const res = await POST(makeWebhookRequest());
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.received).toBe(true);
      // Should NOT have updated the user — duplicate was short-circuited
      expect(prisma.user.updateMany).not.toHaveBeenCalled();
    });

    it("continues processing when idempotency DB write fails for non-unique reasons", async () => {
      mockConstructEvent.mockReturnValue({
        id: "evt_test123",
        type: "customer.subscription.deleted",
        data: { object: makeSubscription({ customerId: "cus_test123" }) },
      });

      // Non-unique DB error — should fail open and still process the event
      vi.mocked(prisma.processedStripeEvent.create).mockRejectedValue(
        new Error("Connection refused")
      );

      const res = await POST(makeWebhookRequest());
      expect(res.status).toBe(200);
      expect(prisma.user.updateMany).toHaveBeenCalledWith({
        where: { stripeCustomerId: "cus_test123" },
        data: { plan: "free", stripeSubscriptionId: null },
      });
    });
  });

  // ── customer.subscription.created ──────────────────────────────────────────

  describe("customer.subscription.created", () => {
    it("sets the user's plan to starter when the starter price is used", async () => {
      mockConstructEvent.mockReturnValue({
        type: "customer.subscription.created",
        data: { object: makeSubscription({ priceId: "price_starter_test" }) },
      });

      const res = await POST(makeWebhookRequest());
      expect(res.status).toBe(200);
      expect(prisma.user.updateMany).toHaveBeenCalledWith({
        where: { stripeCustomerId: "cus_test123" },
        data: { plan: "starter", stripeSubscriptionId: expect.any(String) },
      });
    });

    it("sets the user's plan to pro when the pro price is used", async () => {
      mockConstructEvent.mockReturnValue({
        type: "customer.subscription.created",
        data: { object: makeSubscription({ priceId: "price_pro_test" }) },
      });

      await POST(makeWebhookRequest());
      expect(prisma.user.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ plan: "pro" }) })
      );
    });

    it("sets the user's plan to agency when the agency price is used", async () => {
      mockConstructEvent.mockReturnValue({
        type: "customer.subscription.created",
        data: { object: makeSubscription({ priceId: "price_agency_test" }) },
      });

      await POST(makeWebhookRequest());
      expect(prisma.user.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ plan: "agency" }) })
      );
    });

    it("does not update the plan when the subscription is inactive", async () => {
      mockConstructEvent.mockReturnValue({
        type: "customer.subscription.created",
        data: { object: makeSubscription({ status: "past_due" }) },
      });

      await POST(makeWebhookRequest());
      expect(prisma.user.updateMany).not.toHaveBeenCalled();
    });

    it("does not update the plan when the priceId is unrecognized", async () => {
      mockConstructEvent.mockReturnValue({
        type: "customer.subscription.created",
        data: { object: makeSubscription({ priceId: "price_unknown_xyz" }) },
      });

      await POST(makeWebhookRequest());
      expect(prisma.user.updateMany).not.toHaveBeenCalled();
    });

    it("handles an expanded customer object (not just a string ID)", async () => {
      mockConstructEvent.mockReturnValue({
        type: "customer.subscription.created",
        data: {
          object: {
            customer: { id: "cus_expanded123" },
            status: "active",
            items: { data: [{ price: { id: "price_starter_test" } }] },
          },
        },
      });

      await POST(makeWebhookRequest());
      expect(prisma.user.updateMany).toHaveBeenCalledWith({
        where: { stripeCustomerId: "cus_expanded123" },
        data: { plan: "starter" },
      });
    });
  });

  // ── checkout.session.completed ──────────────────────────────────────────────

  describe("checkout.session.completed", () => {
    it("links the Stripe customer ID to the user on subscription checkout", async () => {
      mockConstructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: {
          object: {
            mode: "subscription",
            metadata: { userId: "user_test123" },
            customer: "cus_test456",
          },
        },
      });

      await POST(makeWebhookRequest());
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user_test123" },
        data: { stripeCustomerId: "cus_test456" },
      });
    });

    it("skips non-subscription checkout sessions (e.g. one-time payment)", async () => {
      mockConstructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: {
          object: {
            mode: "payment",
            metadata: { userId: "user_test123" },
            customer: "cus_test456",
          },
        },
      });

      await POST(makeWebhookRequest());
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("does not throw when userId is missing from session metadata", async () => {
      mockConstructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_test_123",
            mode: "subscription",
            metadata: {},
            customer: "cus_test456",
          },
        },
      });

      const res = await POST(makeWebhookRequest());
      expect(res.status).toBe(200);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  // ── customer.subscription.updated ──────────────────────────────────────────

  describe("customer.subscription.updated", () => {
    it("updates the user's plan when the subscription is still active", async () => {
      mockConstructEvent.mockReturnValue({
        type: "customer.subscription.updated",
        data: {
          object: makeSubscription({ customerId: "cus_test123", priceId: "price_pro_test" }),
        },
      });

      await POST(makeWebhookRequest());
      expect(prisma.user.updateMany).toHaveBeenCalledWith({
        where: { stripeCustomerId: "cus_test123" },
        data: { plan: "pro" },
      });
    });

    it("keeps the user's paid plan when subscription becomes past_due (grace period)", async () => {
      mockConstructEvent.mockReturnValue({
        type: "customer.subscription.updated",
        data: {
          object: makeSubscription({ customerId: "cus_test123", priceId: "price_pro_test", status: "past_due" }),
        },
      });

      await POST(makeWebhookRequest());
      expect(prisma.user.updateMany).toHaveBeenCalledWith({
        where: { stripeCustomerId: "cus_test123" },
        data: { plan: "pro" },
      });
    });

    it("downgrades to free when the subscription becomes canceled", async () => {
      mockConstructEvent.mockReturnValue({
        type: "customer.subscription.updated",
        data: { object: makeSubscription({ status: "canceled" }) },
      });

      await POST(makeWebhookRequest());
      expect(prisma.user.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: { plan: "free" } })
      );
    });

    it("downgrades to free when the subscription becomes unpaid", async () => {
      mockConstructEvent.mockReturnValue({
        type: "customer.subscription.updated",
        data: { object: makeSubscription({ status: "unpaid" }) },
      });

      await POST(makeWebhookRequest());
      expect(prisma.user.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: { plan: "free" } })
      );
    });
  });

  // ── customer.subscription.deleted ──────────────────────────────────────────

  describe("customer.subscription.deleted", () => {
    it("sets the user's plan to free and clears subscription ID when deleted", async () => {
      mockConstructEvent.mockReturnValue({
        type: "customer.subscription.deleted",
        data: { object: makeSubscription({ customerId: "cus_test123" }) },
      });

      await POST(makeWebhookRequest());
      expect(prisma.user.updateMany).toHaveBeenCalledWith({
        where: { stripeCustomerId: "cus_test123" },
        data: { plan: "free", stripeSubscriptionId: null },
      });
    });
  });

  // ── invoice.payment_failed ──────────────────────────────────────────────────

  describe("invoice.payment_failed", () => {
    it("returns 200 without changing the user's plan", async () => {
      mockConstructEvent.mockReturnValue({
        type: "invoice.payment_failed",
        data: {
          object: {
            customer: "cus_test123",
            attempt_count: 1,
          },
        },
      });

      const res = await POST(makeWebhookRequest());
      expect(res.status).toBe(200);
      expect(prisma.user.updateMany).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  // ── General ─────────────────────────────────────────────────────────────────

  it("returns { received: true } on successful processing", async () => {
    mockConstructEvent.mockReturnValue({
      type: "customer.subscription.deleted",
      data: { object: makeSubscription() },
    });

    const res = await POST(makeWebhookRequest());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.received).toBe(true);
  });

  it("returns 200 for unhandled event types without error", async () => {
    mockConstructEvent.mockReturnValue({
      type: "invoice.payment_succeeded",
      data: { object: {} },
    });

    const res = await POST(makeWebhookRequest());
    expect(res.status).toBe(200);
  });
});
