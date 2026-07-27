import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AdminService } from "@/lib/admin/admin.service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return apiError("UNAUTHORIZED", "Non authentifié", 401);
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const userRole = String(profile?.role || "").toUpperCase();

  if (userRole !== "ADMIN") {
    return apiError("FORBIDDEN", "Accès réservé aux administrateurs", 403);
  }

  try {
    const { status } = await request.json();
    if (!["OPEN", "IN_REVIEW", "CLOSED"].includes(status)) {
      return apiError("BAD_REQUEST", "Statut de signalement invalide (OPEN, IN_REVIEW, CLOSED)", 400);
    }

    const updated = await AdminService.updateReportStatus(id, status, user.id);
    return apiSuccess(updated, `Signalement mis à jour (${status})`);
  } catch (err: any) {
    return apiError("SERVER_ERROR", err.message || "Erreur de mise à jour du signalement", 500);
  }
}
