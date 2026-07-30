import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PaymentService } from "@/lib/payments/payment.service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { prisma } from "@/lib/prisma/client";

export async function PATCH(
  _request: NextRequest,
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
    return apiError("FORBIDDEN", "Accès interdit", 403);
  }

  try {
    const updated = await PaymentService.approvePayment(id, user.id);
    return apiSuccess(updated, "Paiement validé avec succès (Abonnement et Badge activés)");
  } catch (err: any) {
    return apiError("SERVER_ERROR", err.message || "Erreur de validation", 500);
  }
}
