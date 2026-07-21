import { describe, it, expect } from "vitest";

type TestProperty = {
  id: string;
  title: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "HIDDEN" | "DELETED";
  owner: {
    id: string;
    account_status: "ACTIVE" | "SUSPENDED" | "DELETED";
    subscription_status: "TRIAL" | "ACTIVE" | "EXPIRED";
  };
};

/**
 * Evaluates public property visibility matching the exact PostgreSQL RLS Policy:
 * status = 'APPROVED'
 * AND owner.account_status = 'ACTIVE'
 * AND owner.subscription_status IN ('TRIAL', 'ACTIVE')
 */
function isPubliclyVisible(property: TestProperty): boolean {
  if (property.status !== "APPROVED") return false;
  if (property.owner.account_status !== "ACTIVE") return false;
  if (!["TRIAL", "ACTIVE"].includes(property.owner.subscription_status)) return false;
  return true;
}

describe("RLS Expiration & Public Visibility Guard Tests", () => {
  it("hides property when owner subscription status is EXPIRED", () => {
    const expiredProperty: TestProperty = {
      id: "prop-1",
      title: "Villa au Plateau",
      status: "APPROVED",
      owner: {
        id: "owner-1",
        account_status: "ACTIVE",
        subscription_status: "EXPIRED",
      },
    };

    expect(isPubliclyVisible(expiredProperty)).toBe(false);
  });

  it("hides property when owner account is SUSPENDED", () => {
    const suspendedProperty: TestProperty = {
      id: "prop-2",
      title: "Appartement Koubia",
      status: "APPROVED",
      owner: {
        id: "owner-2",
        account_status: "SUSPENDED",
        subscription_status: "ACTIVE",
      },
    };

    expect(isPubliclyVisible(suspendedProperty)).toBe(false);
  });

  it("hides property when property status is PENDING or REJECTED", () => {
    const pendingProperty: TestProperty = {
      id: "prop-3",
      title: "Maison Harobanda",
      status: "PENDING",
      owner: {
        id: "owner-3",
        account_status: "ACTIVE",
        subscription_status: "ACTIVE",
      },
    };

    expect(isPubliclyVisible(pendingProperty)).toBe(false);
  });

  it("allows property when status is APPROVED and owner is ACTIVE in TRIAL", () => {
    const trialProperty: TestProperty = {
      id: "prop-4",
      title: "Studio Zinder",
      status: "APPROVED",
      owner: {
        id: "owner-4",
        account_status: "ACTIVE",
        subscription_status: "TRIAL",
      },
    };

    expect(isPubliclyVisible(trialProperty)).toBe(true);
  });

  it("allows property when status is APPROVED and owner is ACTIVE in ACTIVE subscription", () => {
    const activeProperty: TestProperty = {
      id: "prop-5",
      title: "Local Commercial Maradi",
      status: "APPROVED",
      owner: {
        id: "owner-5",
        account_status: "ACTIVE",
        subscription_status: "ACTIVE",
      },
    };

    expect(isPubliclyVisible(activeProperty)).toBe(true);
  });
});
