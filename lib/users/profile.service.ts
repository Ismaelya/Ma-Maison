import { ProfileRepository } from "./profile.repository";
import { AuditService } from "@/lib/audit/audit.service";
import type { Profile } from "@/types";

export class ProfileService {
  static async getProfile(id: string): Promise<Profile | null> {
    return ProfileRepository.findById(id);
  }

  static async updateProfile(id: string, updates: Partial<Profile>): Promise<Profile> {
    return ProfileRepository.update(id, updates);
  }

  /**
   * Soft deletes user account: status = DELETED, anonymizes credentials, revokes sessions.
   * Section 47 v1.1 spec compliant (never physical row deletion).
   */
  static async softDeleteAccount(userId: string): Promise<void> {
    await ProfileRepository.softDelete(userId);
    await AuditService.logAudit(userId, "ADMIN_ACTION", userId, { type: "ACCOUNT_SOFT_DELETED" });
  }
}
