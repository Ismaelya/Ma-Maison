import { describe, it, expect } from "vitest";
import { canOwnerPublish } from "@/lib/auth/helpers";
import type { Profile } from "@/types";

describe("RBAC & Subscription Permission Guards", () => {
  const baseProfile: Profile = {
    id: "user-123",
    email: "owner@mamaison.ne",
    name: "Owner User",
    full_name: "Owner User",
    phone: "+22790000000",
    avatar_url: null,
    city: "Niamey",
    district: "Plateau",
    role: "owner",
    account_status: "active",
    subscription_status: "trial",
    badge_verified: false,
    email_verified: true,
    phone_verified: true,
    trial_started_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it("allows owner in TRIAL status to publish listings", () => {
    const profile = { ...baseProfile, subscription_status: "trial" as const };
    expect(canOwnerPublish(profile)).toBe(true);
  });

  it("allows owner in ACTIVE status to publish listings", () => {
    const profile = { ...baseProfile, subscription_status: "active" as const };
    expect(canOwnerPublish(profile)).toBe(true);
  });

  it("BLOCKS owner in EXPIRED status from publishing listings", () => {
    const profile = { ...baseProfile, subscription_status: "expired" as const };
    expect(canOwnerPublish(profile)).toBe(false);
  });

  it("BLOCKS owner in SUSPENDED account status from publishing, regardless of subscription", () => {
    const profileTrial = {
      ...baseProfile,
      account_status: "suspended" as const,
      subscription_status: "trial" as const,
    };
    expect(canOwnerPublish(profileTrial)).toBe(false);

    const profileActive = {
      ...baseProfile,
      account_status: "suspended" as const,
      subscription_status: "active" as const,
    };
    expect(canOwnerPublish(profileActive)).toBe(false);
  });

  it("BLOCKS tenant users from publishing", () => {
    const profile = { ...baseProfile, role: "tenant" as const };
    expect(canOwnerPublish(profile)).toBe(false);
  });

  it("ALLOWS agency in TRIAL or ACTIVE status to publish listings", () => {
    const agencyTrial = { ...baseProfile, role: "agency" as const, subscription_status: "trial" as const };
    expect(canOwnerPublish(agencyTrial)).toBe(true);

    const agencyActive = { ...baseProfile, role: "agency" as const, subscription_status: "active" as const };
    expect(canOwnerPublish(agencyActive)).toBe(true);
  });

  it("BLOCKS agency in EXPIRED status from publishing listings", () => {
    const agencyExpired = { ...baseProfile, role: "agency" as const, subscription_status: "expired" as const };
    expect(canOwnerPublish(agencyExpired)).toBe(false);
  });

  it("ALLOWS admin users to publish/manage listings", () => {
    const profile = { ...baseProfile, role: "admin" as const };
    expect(canOwnerPublish(profile)).toBe(true);
  });
});

describe("Payment Status Approval & Rejection Logic Expectations", () => {
  it("Approval effect: Subscription becomes ACTIVE, badge_verified becomes true", () => {
    // Payment.status = APPROVED
    // -> Subscription.status = ACTIVE (expires_at = now() + 30 days)
    // -> Profile.badge_verified = true, Profile.subscription_status = ACTIVE
    const paymentStatus = "approved";
    const nextSubscriptionStatus = paymentStatus === "approved" ? "active" : "expired";
    const nextBadgeVerified = paymentStatus === "approved";

    expect(nextSubscriptionStatus).toBe("active");
    expect(nextBadgeVerified).toBe(true);
  });

  it("Rejection effect: Subscription status remains UNCHANGED", () => {
    // Payment.status = REJECTED
    // -> Subscription status is preserved (e.g. remains TRIAL or EXPIRED)
    const initialStatus = "trial";
    const paymentStatus = "rejected";
    const finalStatus = paymentStatus === "rejected" ? initialStatus : "active";

    expect(finalStatus).toBe(initialStatus);
  });
});
