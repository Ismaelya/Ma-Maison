import { createClient } from "@/lib/supabase/server";
import { PaymentService } from "@/lib/payments/payment.service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return apiError("UNAUTHORIZED", "Non authentifié", 401);
  }

  // ── Guard global : mode Premium suspendu ──────────────────────────────────
  const { data: appSettings } = await supabase
    .from("app_settings")
    .select("premiumEnabled")
    .limit(1)
    .maybeSingle();

  if (appSettings?.premiumEnabled === false) {
    return apiError(
      "PREMIUM_PAUSED",
      "Les abonnements Premium sont temporairement suspendus. Revenez bientôt !",
      403
    );
  }
  // ─────────────────────────────────────────────────────────────────────────

  try {
    const { method, receiptUrl, amount } = await request.json();
    const payment = await PaymentService.submitPaymentRequest(user.id, {
      method,
      receiptUrl,
      amount,
    });

    return apiSuccess(payment, "Demande de paiement envoyée avec succès", 201);
  } catch (err: any) {
    return apiError("BAD_REQUEST", err.message || "Erreur de soumission du paiement", 400);
  }
}
