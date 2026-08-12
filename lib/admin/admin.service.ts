import { createAdminClient } from "@/lib/supabase/server";
import { AuditService } from "@/lib/audit/audit.service";
import { NotificationService } from "@/lib/notifications/notification.service";
import type { AuditAction } from "@/types";

export class AdminService {
  /**
   * Suspends or unsuspends a user account.
   * Uses the service-role admin client directly — no Prisma fallback needed.
   */
  static async toggleUserSuspension(targetUserId: string, suspend: boolean, adminId: string) {
    const newStatus = suspend ? "SUSPENDED" : "ACTIVE";

    const supabaseAdmin = await createAdminClient();
    const { data: updatedProfile, error } = await supabaseAdmin
      .from("profiles")
      .update({ status: newStatus } as any)
      .eq("id", targetUserId)
      .select()
      .single();

    if (error) {
      throw new Error(`Échec de la suspension/réactivation du compte : ${error.message}`);
    }

    const action: AuditAction = suspend ? "ACCOUNT_SUSPENDED" : "ADMIN_ACTION";
    try {
      await AuditService.logAudit(
        adminId,
        action,
        targetUserId,
        { status: newStatus, type: suspend ? "ACCOUNT_SUSPENDED" : "ACCOUNT_REACTIVATED" }
      );
    } catch {
      // Audit log is best-effort — never block the primary action
    }

    return updatedProfile;
  }

  /**
   * Approves, rejects, or hides property listing moderation.
   * Uses the service-role admin client directly — no Prisma fallback needed.
   */
  static async moderateProperty(propertyId: string, status: "APPROVED" | "REJECTED" | "HIDDEN", adminId: string) {
    const supabaseAdmin = await createAdminClient();
    const { data: updatedProperty, error } = await supabaseAdmin
      .from("properties")
      .update({ status } as any)
      .eq("id", propertyId)
      .select()
      .single();

    if (error) {
      throw new Error(`Échec de la modération de l'annonce : ${error.message}`);
    }

    let auditAction: AuditAction = "ADMIN_ACTION";
    if (status === "APPROVED") auditAction = "PROPERTY_APPROVED";
    if (status === "REJECTED") auditAction = "PROPERTY_REJECTED";

    try {
      await AuditService.logAudit(
        adminId,
        auditAction,
        propertyId,
        { status }
      );
    } catch {
      // Audit log is best-effort — never block the primary action
    }

    // Send notification to the property owner
    const ownerId = updatedProperty?.ownerId || updatedProperty?.owner_id;
    if (ownerId && (status === "APPROVED" || status === "REJECTED")) {
      try {
        const title = status === "APPROVED" ? "Annonce validée !" : "Annonce refusée";
        const message =
          status === "APPROVED"
            ? `Votre annonce "${updatedProperty.title}" a été validée par la modération et est maintenant visible en ligne.`
            : `Votre annonce "${updatedProperty.title}" a été refusée par la modération.`;
        const notifType = status === "APPROVED" ? "PROPERTY_APPROVED" : "PROPERTY_REJECTED";

        await NotificationService.createNotification({
          userId: ownerId,
          type: notifType,
          title,
          message,
          link: status === "APPROVED" ? `/recherche` : `/dashboard/annonces`,
        });
      } catch (notifErr) {
        console.warn("Property moderation notification warning:", notifErr);
      }
    }

    return updatedProperty;
  }

  /**
   * Updates report status.
   * Uses the service-role admin client directly — no Prisma fallback needed.
   */
  static async updateReportStatus(reportId: string, status: "OPEN" | "IN_REVIEW" | "CLOSED", adminId: string) {
    const supabaseAdmin = await createAdminClient();
    const { data: updatedReport, error } = await supabaseAdmin
      .from("reports")
      .update({ status } as any)
      .eq("id", reportId)
      .select()
      .single();

    if (error) {
      throw new Error(`Échec de la mise à jour du signalement : ${error.message}`);
    }

    try {
      await AuditService.logAudit(
        adminId,
        "ADMIN_ACTION",
        reportId,
        { status, type: "REPORT_STATUS_UPDATED" }
      );
    } catch {
      // Audit log is best-effort — never block the primary action
    }

    return updatedReport;
  }
}
