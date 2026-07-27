import { describe, it, expect, vi } from "vitest";
import { AdminService } from "@/lib/admin/admin.service";
import { AuditService } from "@/lib/audit/audit.service";
import { createAdminClient } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: vi.fn(),
  createClient: vi.fn(),
}));

describe("Sprint 8 — Admin Dashboard Services & Audit Logs", () => {
  it("logs ACCOUNT_SUSPENDED audit entry when suspending a user", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: "user-123", status: "SUSPENDED" },
                error: null,
              }),
            }),
          }),
        }),
      }),
    };
    (createAdminClient as any).mockResolvedValue(mockSupabase);
    const auditSpy = vi.spyOn(AuditService, "logAudit").mockResolvedValue(undefined);

    const res = await AdminService.toggleUserSuspension("user-123", true, "admin-001");

    expect(res.status).toBe("SUSPENDED");
    expect(auditSpy).toHaveBeenCalledWith(
      "admin-001",
      "ACCOUNT_SUSPENDED",
      "user-123",
      expect.objectContaining({ status: "SUSPENDED", type: "ACCOUNT_SUSPENDED" })
    );

    auditSpy.mockRestore();
  });

  it("logs PROPERTY_APPROVED and PROPERTY_REJECTED during moderation", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: "prop-456", status: "APPROVED" },
                error: null,
              }),
            }),
          }),
        }),
      }),
    };
    (createAdminClient as any).mockResolvedValue(mockSupabase);
    const auditSpy = vi.spyOn(AuditService, "logAudit").mockResolvedValue(undefined);

    await AdminService.moderateProperty("prop-456", "APPROVED", "admin-001");

    expect(auditSpy).toHaveBeenCalledWith(
      "admin-001",
      "PROPERTY_APPROVED",
      "prop-456",
      expect.objectContaining({ status: "APPROVED" })
    );

    auditSpy.mockRestore();
  });

  it("logs ADMIN_ACTION when report status is updated", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: "rep-789", status: "CLOSED" },
                error: null,
              }),
            }),
          }),
        }),
      }),
    };
    (createAdminClient as any).mockResolvedValue(mockSupabase);
    const auditSpy = vi.spyOn(AuditService, "logAudit").mockResolvedValue(undefined);

    await AdminService.updateReportStatus("rep-789", "CLOSED", "admin-001");

    expect(auditSpy).toHaveBeenCalledWith(
      "admin-001",
      "ADMIN_ACTION",
      "rep-789",
      expect.objectContaining({ type: "REPORT_STATUS_CHANGE", status: "CLOSED" })
    );

    auditSpy.mockRestore();
  });
});
