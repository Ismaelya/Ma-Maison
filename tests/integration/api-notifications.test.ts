import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PATCH } from "@/app/api/notifications/route";
import { NotificationService } from "@/lib/notifications/notification.service";

const mockGetUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

vi.mock("@/lib/notifications/notification.service", () => ({
  NotificationService: {
    getUserNotifications: vi.fn(),
    markAsRead: vi.fn(),
  },
}));

describe("API Integration: GET & PATCH /api/notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns 401 when user is unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const req = new Request("http://localhost:3000/api/notifications");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Non authentifié");
  });

  it("GET returns user notifications when authenticated", async () => {
    const userId = "user-notif-1";
    mockGetUser.mockResolvedValue({ data: { user: { id: userId } } });

    vi.spyOn(NotificationService, "getUserNotifications").mockResolvedValue([
      {
        id: "notif-1",
        userId,
        type: "NEW_MESSAGE",
        title: "Nouveau message",
        message: "Bonjour",
        isRead: false,
        createdAt: new Date(),
      } as any,
    ]);

    const req = new Request("http://localhost:3000/api/notifications");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.notifications).toHaveLength(1);
    expect(body.notifications[0].id).toBe("notif-1");
  });

  it("PATCH returns 400 when notification ID is missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-notif-1" } } });

    const req = new Request("http://localhost:3000/api/notifications", {
      method: "PATCH",
      body: JSON.stringify({}), // missing id
    });

    const res = await PATCH(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain("requis");
  });

  it("PATCH marks notification as read when ID is valid (200)", async () => {
    const userId = "user-notif-1";
    mockGetUser.mockResolvedValue({ data: { user: { id: userId } } });

    vi.spyOn(NotificationService, "markAsRead").mockResolvedValue({
      id: "notif-1",
      userId,
      isRead: true,
    } as any);

    const req = new Request("http://localhost:3000/api/notifications", {
      method: "PATCH",
      body: JSON.stringify({ id: "notif-1" }),
    });

    const res = await PATCH(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.notification.isRead).toBe(true);
  });
});
