import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PaymentService } from "@/lib/payments/payment.service";
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
  if (profile?.role !== "ADMIN" && profile?.role !== "admin") {
    return apiError("FORBIDDEN", "Accès interdit", 403);
  }

  try {
    const { reason } = await request.json().catch(() => ({ reason: undefined }));
    const updated = await PaymentService.rejectPayment(id, user.id, reason);
    return apiSuccess(updated, "Paiement rejeté");
  } catch (err: any) {
    return apiError("SERVER_ERROR", err.message || "Erreur de rejet", 500);
  }
}
