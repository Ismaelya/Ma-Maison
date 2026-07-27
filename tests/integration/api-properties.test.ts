import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/properties/route";
import { PropertyService } from "@/lib/properties/property.service";
import { NextRequest } from "next/server";

// Mock Supabase server helper
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

vi.mock("@/lib/properties/property.service", () => ({
  PropertyService: {
    searchProperties: vi.fn(),
    createProperty: vi.fn(),
  },
}));

describe("API Integration: GET /api/properties", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sanitizes property address for unauthenticated users", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    vi.spyOn(PropertyService, "searchProperties").mockResolvedValue([
      {
        id: "prop-101",
        title: "Villa Yantala",
        price: 250000,
        address: "Rue 14, Porte 25, Yantala",
        city: "Niamey",
      } as any,
    ]);

    const req = new NextRequest("http://localhost:3000/api/properties?city=Niamey");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].address).toBeUndefined(); // Sanitized!
    expect(body.data[0].title).toBe("Villa Yantala");
  });

  it("returns full property details (with address) for authenticated users", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "user@mamaison.ne" } },
      error: null,
    });
    vi.spyOn(PropertyService, "searchProperties").mockResolvedValue([
      {
        id: "prop-101",
        title: "Villa Yantala",
        price: 250000,
        address: "Rue 14, Porte 25, Yantala",
        city: "Niamey",
      } as any,
    ]);

    const req = new NextRequest("http://localhost:3000/api/properties?city=Niamey");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data[0].address).toBe("Rue 14, Porte 25, Yantala");
  });
});

describe("API Integration: POST /api/properties", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects creation when user is unauthenticated (401)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const req = new Request("http://localhost:3000/api/properties", {
      method: "POST",
      body: JSON.stringify({ title: "Maison a vendre" }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("rejects creation when owner subscription is EXPIRED (403)", async () => {
    const userId = "owner-expired";
    mockGetUser.mockResolvedValue({ data: { user: { id: userId } }, error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: { id: userId, role: "OWNER", status: "ACTIVE" },
              }),
            }),
          }),
        };
      }
      if (table === "subscriptions") {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => Promise.resolve({
                  data: [{ id: "sub-1", userId, status: "EXPIRED" }],
                }),
              }),
            }),
          }),
        };
      }
      return {};
    });

    const req = new Request("http://localhost:3000/api/properties", {
      method: "POST",
      body: JSON.stringify({ title: "Appartement Plateau" }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("SUBSCRIPTION_REQUIRED");
  });

  it("creates property successfully when user has ACTIVE subscription (201)", async () => {
    const userId = "owner-active";
    mockGetUser.mockResolvedValue({ data: { user: { id: userId } }, error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: { id: userId, role: "OWNER", status: "ACTIVE" },
              }),
            }),
          }),
        };
      }
      if (table === "subscriptions") {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => Promise.resolve({
                  data: [{ id: "sub-2", userId, status: "ACTIVE" }],
                }),
              }),
            }),
          }),
        };
      }
      return {};
    });

    vi.spyOn(PropertyService, "createProperty").mockResolvedValue({
      id: "prop-new-1",
      title: "Superbe Villa Goudel",
      ownerId: userId,
      status: "PENDING",
    } as any);

    const req = new Request("http://localhost:3000/api/properties", {
      method: "POST",
      body: JSON.stringify({ title: "Superbe Villa Goudel", price: 300000 }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe("prop-new-1");
  });
});
