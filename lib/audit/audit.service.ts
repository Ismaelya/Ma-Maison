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
        id: crypto.randomUUID(),
        actorId: actorId,
        action: action,
        targetId: targetId ?? null,
        metadata: metadata ?? {},
      } as any);
    } catch (err) {
      console.error("Erreur lors de la journalisation audit:", err);
    }
  }
}
