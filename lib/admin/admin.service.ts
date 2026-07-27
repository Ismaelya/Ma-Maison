import { createAdminClient } from "@/lib/supabase/server";
import { AuditService } from "@/lib/audit/audit.service";
import type { AuditAction } from "@/types";

export class AdminService {
  /**
   * Suspends or unsuspends a user account.
   */
  static async toggleUserSuspension(targetUserId: string, suspend: boolean, adminId: string) {
    const supabaseAdmin = await createAdminClient();
    const newStatus = suspend ? "SUSPENDED" : "ACTIVE";

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update({
        status: newStatus,
      } as any)
      .eq("id", targetUserId)
      .select()
      .single();

    if (error) {
      // Fallback try with status column
      const { data: retryData, error: retryError } = await supabaseAdmin
        .from("profiles")
        .update({ status: newStatus } as any)
        .eq("id", targetUserId)
        .select()
        .single();
      if (retryError) throw new Error(retryError.message);
    }

    const action: AuditAction = suspend ? "ACCOUNT_SUSPENDED" : "ADMIN_ACTION";
    await AuditService.logAudit(
      adminId,
      action,
      targetUserId,
      { status: newStatus, type: suspend ? "ACCOUNT_SUSPENDED" : "ACCOUNT_REACTIVATED" }
    );

    return data;
  }

  /**
   * Approves, rejects, or hides property listing moderation.
   */
  static async moderateProperty(propertyId: string, status: "APPROVED" | "REJECTED" | "HIDDEN", adminId: string) {
    const supabaseAdmin = await createAdminClient();

    const { data, error } = await supabaseAdmin
      .from("properties")
      .update({
        status,
      } as any)
      .eq("id", propertyId)
      .select()
      .single();

    if (error) {
      // Fallback legacy listings update
      await supabaseAdmin
        .from("listings")
        .update({ status } as any)
        .eq("id", propertyId);
    }

    let auditAction: AuditAction = "ADMIN_ACTION";
    if (status === "APPROVED") auditAction = "PROPERTY_APPROVED";
    if (status === "REJECTED") auditAction = "PROPERTY_REJECTED";

    await AuditService.logAudit(
      adminId,
      auditAction,
      propertyId,
      { status }
    );

    return data;
  }

  /**
   * Updates report status (OPEN -> IN_REVIEW -> CLOSED).
   */
  static async updateReportStatus(reportId: string, status: "OPEN" | "IN_REVIEW" | "CLOSED", adminId: string) {
    const supabaseAdmin = await createAdminClient();

    const { data, error } = await supabaseAdmin
      .from("reports")
      .update({
        status,
      } as any)
      .eq("id", reportId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    await AuditService.logAudit(
      adminId,
      "ADMIN_ACTION",
      reportId,
      { type: "REPORT_STATUS_CHANGE", status }
    );

    return data;
  }
}
