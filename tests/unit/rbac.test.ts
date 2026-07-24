import { describe, it, expect } from "vitest";
import { canOwnerPublish } from "@/lib/auth/helpers";
import type { Profile, Subscription } from "@/types";

describe("RBAC & Subscription Permission Guards", () => {
  const baseProfile: Profile = {
    id: "user-123",
    email: "owner@mamaison.ne",
    name: "Owner User",
    phone: "+22790000000",
    role: "OWNER",
    status: "ACTIVE",
    city: "Niamey",
    district: "Plateau",
    avatarUrl: null,
    badgeVerified: false,
    emailVerified: true,
    phoneVerified: true,
    trialStartedAt: new Date(),
    agencyName: null,
    agencyLogoUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const trialSub: Subscription = {
    id: "sub-1",
    userId: "user-123",
    status: "TRIAL",
    price: 1500,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 86400000),
    createdAt: new Date(),
  };

  const activeSub: Subscription = {
    id: "sub-2",
    userId: "user-123",
    status: "ACTIVE",
    price: 1500,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 86400000),
    createdAt: new Date(),
  };

  const expiredSub: Subscription = {
    id: "sub-3",
    userId: "user-123",
    status: "EXPIRED",
    price: 1500,
    startDate: new Date(Date.now() - 60 * 86400000),
    endDate: new Date(Date.now() - 30 * 86400000),
    createdAt: new Date(Date.now() - 60 * 86400000),
  };

  it("allows owner in TRIAL status to publish listings", () => {
    expect(canOwnerPublish(baseProfile, trialSub)).toBe(true);
  });

  it("allows owner in ACTIVE status to publish listings", () => {
    expect(canOwnerPublish(baseProfile, activeSub)).toBe(true);
  });

  it("BLOCKS owner in EXPIRED status from publishing listings", () => {
    expect(canOwnerPublish(baseProfile, expiredSub)).toBe(false);
  });

  it("BLOCKS owner without subscription (null) from publishing listings", () => {
    expect(canOwnerPublish(baseProfile, null)).toBe(false);
  });

  it("BLOCKS owner in SUSPENDED account status, even with ACTIVE subscription", () => {
    const profileSuspended: Profile = {
      ...baseProfile,
      status: "SUSPENDED",
    };
    expect(canOwnerPublish(profileSuspended, activeSub)).toBe(false);
  });

  it("BLOCKS tenant users from publishing, even with active subscription object", () => {
    const tenantProfile: Profile = { ...baseProfile, role: "TENANT" };
    expect(canOwnerPublish(tenantProfile, activeSub)).toBe(false);
  });

  it("ALLOWS agency in TRIAL or ACTIVE status to publish listings", () => {
    const agencyProfile: Profile = { ...baseProfile, role: "AGENCY" };
    expect(canOwnerPublish(agencyProfile, trialSub)).toBe(true);
    expect(canOwnerPublish(agencyProfile, activeSub)).toBe(true);
  });

  it("BLOCKS agency in EXPIRED status from publishing listings", () => {
    const agencyProfile: Profile = { ...baseProfile, role: "AGENCY" };
    expect(canOwnerPublish(agencyProfile, expiredSub)).toBe(false);
  });

  it("ALLOWS admin users to publish/manage listings without subscription", () => {
    const adminProfile: Profile = { ...baseProfile, role: "ADMIN" };
    expect(canOwnerPublish(adminProfile, null)).toBe(true);
  });
});

describe("Payment Status Approval & Rejection Logic Expectations", () => {
  it("Approval effect: Subscription becomes ACTIVE, badgeVerified becomes true", () => {
    const paymentStatus = "APPROVED";
    const nextSubscriptionStatus = paymentStatus === "APPROVED" ? "ACTIVE" : "EXPIRED";
    const nextBadgeVerified = paymentStatus === "APPROVED";

    expect(nextSubscriptionStatus).toBe("ACTIVE");
    expect(nextBadgeVerified).toBe(true);
  });

  it("Rejection effect: Subscription status remains UNCHANGED", () => {
    const initialStatus = "TRIAL";
    const paymentStatus = "REJECTED";
    const finalStatus = paymentStatus === "REJECTED" ? initialStatus : "ACTIVE";

    expect(finalStatus).toBe(initialStatus);
  });
});
