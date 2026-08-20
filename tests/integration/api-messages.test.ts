import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/messages/route";
import { messagingRateLimiter } from "@/lib/rate-limit";
import { NotificationService } from "@/lib/notifications/notification.service";

const mockRpc = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve({
    auth: {
      getUser: mockGetUser,
    },
    rpc: mockRpc,
  })),
  createAdminClient: vi.fn(() => Promise.resolve({})),
}));

vi.mock("@/lib/notifications/notification.service", () => ({
  NotificationService: {
    createNotification: vi.fn(),
  },
}));

const mockGetUser = vi.fn();

describe("API Integration: POST /api/messages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when missing conversationId or content", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-sender" } } });

    const req = new Request("http://localhost:3000/api/messages", {
      method: "POST",
      body: JSON.stringify({ conversationId: "conv-1" }), // missing content
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain("requis");
  });

  it("returns 429 when rate limit is exceeded (anti-spam guard)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "spam-user" } } });
    vi.spyOn(messagingRateLimiter, "limit").mockResolvedValue({
      success: false,
      limit: 10,
      remaining: 0,
      reset: Date.now() + 60000,
      pending: Promise.resolve(),
    } as any);

    const req = new Request("http://localhost:3000/api/messages", {
      method: "POST",
      body: JSON.stringify({ conversationId: "conv-1", content: "Spam message!" }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.error).toContain("Anti-spam");
  });

  it("creates message & notification via send_message RPC when parameters are valid (200)", async () => {
    const senderId = "tenant-1";
    const conversationId = "conv-100";
    const createdAt = new Date().toISOString();

    mockGetUser.mockResolvedValue({ data: { user: { id: senderId } } });
    vi.spyOn(messagingRateLimiter, "limit").mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 60000,
      pending: Promise.resolve(),
    } as any);

    mockRpc.mockResolvedValue({
      data: { id: "msg-123", createdAt },
      error: null,
    });

    const req = new Request("http://localhost:3000/api/messages", {
      method: "POST",
      body: JSON.stringify({
        conversationId,
        content: "Bonjour, le logement est-il disponible ?",
      }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message.id).toBe("msg-123");
    expect(mockRpc).toHaveBeenCalledWith("send_message", {
      p_conversation_id: conversationId,
      p_content: "Bonjour, le logement est-il disponible ?",
    });
  });
});
