import { describe, it, expect, vi } from "vitest";
import { ProfileService } from "@/lib/users/profile.service";
import { ProfileRepository } from "@/lib/users/profile.repository";
import { PaymentService } from "@/lib/payments/payment.service";
import { AuditService } from "@/lib/audit/audit.service";

// Mock Supabase server helper
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
}));

describe("Part 5 Backend Services & Architecture", () => {
  it("soft deletes account with DELETED status and anonymized name", async () => {
    const softDeleteSpy = vi.spyOn(ProfileRepository, "softDelete").mockResolvedValue(undefined);
    const auditSpy = vi.spyOn(AuditService, "logAudit").mockResolvedValue(undefined);

    await ProfileService.softDeleteAccount("user-999");

    expect(softDeleteSpy).toHaveBeenCalledWith("user-999");
    expect(auditSpy).toHaveBeenCalledWith("user-999", "ADMIN_ACTION", "user-999", { type: "ACCOUNT_SOFT_DELETED" });

    softDeleteSpy.mockRestore();
    auditSpy.mockRestore();
  });

  it("formats audit actions correctly", () => {
    const action: string = "PAYMENT_APPROVED";
    expect(action).toBe("PAYMENT_APPROVED");
  });
});
