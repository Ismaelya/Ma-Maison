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

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const userRole = String(profile?.role || "").toUpperCase();

  if (userRole !== "ADMIN") {
    return apiError("FORBIDDEN", "Accès réservé aux administrateurs", 403);
  }

  try {
    const { suspend } = await request.json();
    if (typeof suspend !== "boolean") {
      return apiError("BAD_REQUEST", "Le paramètre suspend est requis", 400);
    }

    const updated = await AdminService.toggleUserSuspension(id, suspend, user.id);
    return apiSuccess(updated, suspend ? "Compte suspendu" : "Compte réactivé");
  } catch (err: any) {
    return apiError("SERVER_ERROR", err.message || "Erreur de modification du statut", 500);
  }
}
