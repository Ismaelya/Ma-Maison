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
    .select("premiumEnabled, subscriptionPrice")
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
    const { method, receiptUrl } = await request.json();
    // Le montant ne vient jamais du client — toujours forcé côté serveur
    // depuis app_settings.subscriptionPrice (défaut 1500 si absent).
    const amount = appSettings?.subscriptionPrice ?? 1500;
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
