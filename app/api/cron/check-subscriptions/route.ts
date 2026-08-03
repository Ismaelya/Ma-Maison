import { createAdminClient } from "@/lib/supabase/server";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return apiError("UNAUTHORIZED", "Accès non autorisé", 401);
  }

  try {
    const supabaseAdmin = await createAdminClient();
    const nowIso = new Date().toISOString();

    const { data: expiredSubs, error } = await supabaseAdmin
      .from("subscriptions")
      .update({ status: "EXPIRED" } as any)
      .eq("status", "ACTIVE")
      .not("endDate", "is", null)
      .lt("endDate", nowIso)
      .select();

    if (error) throw error;

    const userIds = Array.from(new Set((expiredSubs ?? []).map((sub: any) => sub.userId).filter(Boolean)));
    if (userIds.length > 0) {
      await supabaseAdmin.from("profiles").update({ badgeVerified: false } as any).in("id", userIds);
    }

    const count = (expiredSubs ?? []).length;
    return apiSuccess({ updatedCount: count }, `${count} abonnement(s) expiré(s) mis à jour avec succès.`);
  } catch (err: any) {
    return apiError("CRON_ERROR", err.message || "Erreur d'exécution du cron", 500);
  }
}
