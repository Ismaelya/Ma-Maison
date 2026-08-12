import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST, DELETE } from "@/app/api/favorites/route";
import { NextRequest } from "next/server";

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}));

describe("API Integration: /api/favorites", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("DELETE /api/favorites returns 401 if unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const req = new NextRequest("http://localhost:3000/api/favorites?propertyId=prop-1");
    const res = await DELETE(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
  });

  it("DELETE /api/favorites returns 400 if propertyId is missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });

    const req = new NextRequest("http://localhost:3000/api/favorites");
    const res = await DELETE(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.message).toBe("Identifiant manquant");
  });

  it("DELETE /api/favorites deletes favorite and returns 200", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });

    const mockDelete = vi.fn().mockReturnThis();
    const mockEq1 = vi.fn().mockReturnThis();
    const mockEq2 = vi.fn().mockResolvedValue({ error: null });

    mockFrom.mockReturnValue({
      delete: mockDelete,
      eq: mockEq1,
    });
    mockEq1.mockReturnValue({
      eq: mockEq2,
    });

    const req = new NextRequest("http://localhost:3000/api/favorites?propertyId=prop-1");
    const res = await DELETE(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBe("Retiré des favoris");
    expect(mockFrom).toHaveBeenCalledWith("favorites");
  });
});
