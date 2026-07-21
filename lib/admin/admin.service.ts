import { createAdminClient } from "@/lib/supabase/server";
import { AuditService } from "@/lib/audit/audit.service";

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
        account_status: newStatus,
      } as any)
      .eq("id", targetUserId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    await AuditService.logAudit(
      adminId,
      "ACCOUNT_SUSPENDED",
      targetUserId,
      { status: newStatus }
    );

    return data;
  }

  /**
   * Approves or rejects property listing moderation.
   */
  static async moderateProperty(propertyId: string, approve: boolean, adminId: string) {
    const supabaseAdmin = await createAdminClient();
    const newStatus = approve ? "APPROVED" : "REJECTED";

    const { data, error } = await supabaseAdmin
      .from("properties")
      .update({
        status: newStatus,
        is_published: approve,
      } as any)
      .eq("id", propertyId)
      .select()
      .single();

    if (error) {
      // Fallback legacy listings update
      await supabaseAdmin
        .from("listings")
        .update({ is_published: approve } as any)
        .eq("id", propertyId);
    }

    await AuditService.logAudit(
      adminId,
      approve ? "PROPERTY_APPROVED" : "PROPERTY_REJECTED",
      propertyId
    );

    return data;
  }
}
