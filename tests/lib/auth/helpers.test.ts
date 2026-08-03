import { describe, expect, it } from "vitest";
import { canOwnerPublish } from "@/lib/auth/helpers";

describe("canOwnerPublish", () => {
  it("allows an owner with an active account to publish without a subscription", () => {
    const profile = {
      role: "OWNER",
      status: "ACTIVE",
    } as any;

    expect(canOwnerPublish(profile, null)).toBe(true);
  });

  it("blocks publication for suspended accounts", () => {
    const profile = {
      role: "OWNER",
      status: "SUSPENDED",
    } as any;

    expect(canOwnerPublish(profile, null)).toBe(false);
  });
});
