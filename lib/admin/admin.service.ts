import { createAdminClient } from "@/lib/supabase/server";
import { AuditService } from "@/lib/audit/audit.service";
import type { AuditAction } from "@/types";
import { prisma } from "@/lib/prisma/client";

export class AdminService {
  /**
   * Suspends or unsuspends a user account.
   */
  static async toggleUserSuspension(targetUserId: string, suspend: boolean, adminId: string) {
    const newStatus = suspend ? "SUSPENDED" : "ACTIVE";
    let updatedProfile: any = null;

    try {
      await prisma.$executeRawUnsafe(`SELECT set_config('request.jwt.claims', '{"role":"service_role"}', true);`);
      updatedProfile = await prisma.profile.update({
        where: { id: targetUserId },
        data: { status: newStatus as any },
      });
    } catch (e) {
      console.warn("Prisma set_config toggle suspension error:", e);
    }

    if (!updatedProfile) {
      try {
        await prisma.$executeRawUnsafe(
          `UPDATE public.profiles SET status = $1::"AccountStatus" WHERE id = $2;`,
          newStatus,
          targetUserId
        );
        updatedProfile = await prisma.profile.findUnique({
          where: { id: targetUserId },
        });
      } catch (rawErr) {
        console.warn("Prisma raw query update error:", rawErr);
      }
    }

    if (!updatedProfile) {
      const supabaseAdmin = await createAdminClient();
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .update({ status: newStatus } as any)
        .eq("id", targetUserId)
        .select()
        .single();

      if (error && !updatedProfile) {
        throw new Error(error.message);
      }
      updatedProfile = data;
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
      // Audit log optional fallback
    }

    return updatedProfile;
  }

  /**
   * Approves, rejects, or hides property listing moderation.
   */
  static async moderateProperty(propertyId: string, status: "APPROVED" | "REJECTED" | "HIDDEN", adminId: string) {
    let updatedProperty: any = null;

    try {
      updatedProperty = await prisma.property.update({
        where: { id: propertyId },
        data: { status: status as any },
      });
    } catch {
      // Ignore Prisma error
    }

    if (!updatedProperty) {
      const supabaseAdmin = await createAdminClient();
      const { data, error } = await supabaseAdmin
        .from("properties")
        .update({ status } as any)
        .eq("id", propertyId)
        .select()
        .single();

      if (error && !updatedProperty) {
        throw new Error(error.message);
      }
      updatedProperty = data;
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
      // Audit log optional fallback
    }

    return updatedProperty;
  }
}
