import { createAdminClient } from "@/lib/supabase/server";
import type { AuditAction } from "@/types";

export class AuditService {
  /**
   * Records an audit log entry in audit_logs table.
   */
  static async logAudit(
    actorId: string | null,
    action: AuditAction,
    targetId?: string | null,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const supabase = await createAdminClient();
      await supabase.from("audit_logs").insert({
        actor_id: actorId,
        action: action,
        target_id: targetId ?? null,
        metadata: metadata ?? {},
      } as any);
    } catch (err) {
      console.error("Erreur lors de la journalisation audit:", err);
    }
  }
}
