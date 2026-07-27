import { describe, it, expect } from "vitest";

type PropertyRecord = {
  id: string;
  ownerId: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
};

type ProfileRecord = {
  id: string;
  status: "ACTIVE" | "SUSPENDED";
};

/**
 * Simulates the PostgreSQL RLS policy on public.properties:
 * WHERE status = 'APPROVED'
 *   AND EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = p.ownerId AND pr.status = 'ACTIVE')
 */
function queryPublicVisibleProperties(properties: PropertyRecord[], profiles: ProfileRecord[]): PropertyRecord[] {
  const activeProfileIds = new Set(profiles.filter((p) => p.status === "ACTIVE").map((p) => p.id));
  return properties.filter((prop) => prop.status === "APPROVED" && activeProfileIds.has(prop.ownerId));
}

describe("Automated RLS Expiration/Suspension Guard Test (18 -> 0 -> 18)", () => {
  const targetOwnerId = "target-owner-25dd";

  // Create mock dataset of 18 approved properties belonging to targetOwnerId
  const initialProperties: PropertyRecord[] = Array.from({ length: 18 }, (_, i) => ({
    id: `prop-${i + 1}`,
    ownerId: targetOwnerId,
    status: "APPROVED",
  }));

  let profileState: ProfileRecord = {
    id: targetOwnerId,
    status: "ACTIVE",
  };

  it("1. INITIAL STATE: Owner is ACTIVE -> Returns exactly 18 visible approved properties", () => {
    profileState = { id: targetOwnerId, status: "ACTIVE" };
    const visible = queryPublicVisibleProperties(initialProperties, [profileState]);
    expect(visible).toHaveLength(18);
  });

  it("2. SUSPENDED STATE: Owner account is SUSPENDED -> Returns exactly 0 visible properties", () => {
    profileState = { id: targetOwnerId, status: "SUSPENDED" };
    const visible = queryPublicVisibleProperties(initialProperties, [profileState]);
    expect(visible).toHaveLength(0);
  });

  it("3. REACTIVATED STATE: Owner account is REACTIVATED to ACTIVE -> Returns back 18 visible properties", () => {
    profileState = { id: targetOwnerId, status: "ACTIVE" };
    const visible = queryPublicVisibleProperties(initialProperties, [profileState]);
    expect(visible).toHaveLength(18);
  });
});
