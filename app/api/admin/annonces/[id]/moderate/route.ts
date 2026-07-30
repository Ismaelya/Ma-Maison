import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AdminService } from "@/lib/admin/admin.service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { prisma } from "@/lib/prisma/client";

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

  let profileRole = "";
  try {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    profileRole = profile?.role || "";
  } catch {
    // Ignore Supabase REST error
  }

  if (!profileRole) {
    try {
      const p = await prisma.profile.findUnique({ where: { id: user.id } });
      profileRole = p?.role || "";
    } catch {
      // Ignore DB error
    }
  }

  const userRole = String(profileRole || user.user_metadata?.role || "").toUpperCase();

  if (userRole !== "ADMIN") {
    return apiError("FORBIDDEN", "Accès réservé aux administrateurs", 403);
  }

  try {
    const { status } = await request.json();
    if (!["APPROVED", "REJECTED", "HIDDEN"].includes(status)) {
      return apiError("BAD_REQUEST", "Statut invalide (APPROVED, REJECTED, HIDDEN)", 400);
    }

    const updated = await AdminService.moderateProperty(id, status, user.id);
    return apiSuccess(updated, `Annonce mise à jour (${status})`);
  } catch (err: any) {
    return apiError("SERVER_ERROR", err.message || "Erreur de modération", 500);
  }
}
