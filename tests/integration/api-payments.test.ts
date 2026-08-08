import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/subscription/route";
import { POST } from "@/app/api/subscription/payment-request/route";
import { SubscriptionService } from "@/lib/subscriptions/subscription.service";
import { PaymentService } from "@/lib/payments/payment.service";

const mockGetUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve({
    auth: {
      getUser: mockGetUser,
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { premiumEnabled: true, subscriptionPrice: 1500 },
            error: null,
          }),
        }),
      }),
    }),
  })),
}));

vi.mock("@/lib/subscriptions/subscription.service", () => ({
  SubscriptionService: {
    getSubscriptionStatus: vi.fn(),
  },
}));

vi.mock("@/lib/payments/payment.service", () => ({
  PaymentService: {
    submitPaymentRequest: vi.fn(),
  },
}));

describe("API Integration: GET /api/subscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
  });

  it("returns user subscription details when authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-456" } } });
    vi.spyOn(SubscriptionService, "getSubscriptionStatus").mockResolvedValue({
      id: "sub-456",
      userId: "user-456",
      status: "ACTIVE",
      price: 1500,
      startDate: new Date(),
      endDate: new Date(),
    } as any);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("ACTIVE");
  });
});

describe("API Integration: POST /api/subscription/payment-request", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects payment submission when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const req = new Request("http://localhost:3000/api/subscription/payment-request", {
      method: "POST",
      body: JSON.stringify({ method: "AIRTEL_MONEY", amount: 1500, receiptUrl: "http://rec.png" }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
  });

  it("submits payment request successfully for authenticated user (201)", async () => {
    const userId = "owner-pay-1";
    mockGetUser.mockResolvedValue({ data: { user: { id: userId } } });

    vi.spyOn(PaymentService, "submitPaymentRequest").mockResolvedValue({
      id: "pay-789",
      userId,
      amount: 1500,
      paymentMethod: "MYZAMANI",
      status: "PENDING",
      createdAt: new Date(),
    } as any);

    const req = new Request("http://localhost:3000/api/subscription/payment-request", {
      method: "POST",
      body: JSON.stringify({ method: "MYZAMANI", amount: 1500, receiptUrl: "https://bucket/rec.jpg" }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe("pay-789");
    expect(body.message).toContain("Demande de paiement envoyée");
  });
});
