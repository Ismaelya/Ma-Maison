import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/messages/route";
import { messagingRateLimiter } from "@/lib/rate-limit";
import { NotificationService } from "@/lib/notifications/notification.service";

const mockGetUser = vi.fn();
const mockSingleMessage = vi.fn();
const mockSingleConv = vi.fn();
const mockSingleProfile = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  // Le client authentifié fait la lecture de profil (rôle) ET l'insertion du
  // message (RLS messages_participants_send appliquée) — c'est le vrai chemin
  // de la route, l'admin client ne sert que pour la notification du destinataire.
  createClient: vi.fn(() => Promise.resolve({
    auth: {
      getUser: mockGetUser,
    },
    from: (table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              single: mockSingleProfile,
            }),
          }),
        };
      }
      if (table === "messages") {
        return {
          insert: () => ({
            select: () => ({
              single: mockSingleMessage,
            }),
          }),
        };
      }
      return {};
    },
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  })),
  createAdminClient: vi.fn(() => Promise.resolve({
    from: (table: string) => {
      if (table === "conversations") {
        return {
          select: () => ({
            eq: () => ({
              single: mockSingleConv,
            }),
          }),
        };
      }
      return {};
    },
  })),
}));

vi.mock("@/lib/notifications/notification.service", () => ({
  NotificationService: {
    createNotification: vi.fn(),
  },
}));

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
    vi.spyOn(messagingRateLimiter, "check").mockResolvedValue({
      success: false,
      limit: 10,
      remaining: 0,
      reset: Date.now() + 60000,
    });

    const req = new Request("http://localhost:3000/api/messages", {
      method: "POST",
      body: JSON.stringify({ conversationId: "conv-1", content: "Spam message!" }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.error).toContain("Anti-spam");
  });

  it("creates message & sends notification to recipient when parameters are valid (200)", async () => {
    const senderId = "tenant-1";
    const recipientId = "owner-1";
    const conversationId = "conv-100";

    mockGetUser.mockResolvedValue({ data: { user: { id: senderId } } });
    vi.spyOn(messagingRateLimiter, "check").mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 60000,
    });

    const createdMsg = {
      id: "msg-123",
      conversationId,
      senderId,
      content: "Bonjour, le logement est-il disponible ?",
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    mockSingleProfile.mockResolvedValue({ data: { role: "TENANT" }, error: null });
    mockSingleMessage.mockResolvedValue({ data: createdMsg, error: null });
    mockSingleConv.mockResolvedValue({
      data: { tenantId: senderId, ownerId: recipientId },
      error: null,
    });

    const createNotificationSpy = vi.spyOn(NotificationService, "createNotification").mockResolvedValue({} as any);

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

    expect(createNotificationSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: recipientId,
        type: "NEW_MESSAGE",
        title: "Nouveau message reçu",
      })
    );
  });
});
