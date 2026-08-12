import { createClient, createAdminClient } from "@/lib/supabase/server";
import { AuditService } from "@/lib/audit/audit.service";
import { NotificationService } from "@/lib/notifications/notification.service";
import { randomUUID } from "crypto";

export class PaymentService {
  /**
   * Submits a manual payment request (WAVE, AMANATA, MYNITA) for an owner.
   * Status initialized to PENDING.
   * Uses the authenticated user's Supabase client — RLS enforces ownership.
   */
  static async submitPaymentRequest(userId: string, payload: { method: string; receiptUrl: string; amount?: number; subscriptionId?: string }) {
    let cleanMethod = (payload.method || (payload as any).operator || "WAVE").toUpperCase();
    if (!["AMANATA", "MYNITA", "WAVE"].includes(cleanMethod)) {
      cleanMethod = "WAVE";
    }

    const supabase = await createClient();
    const { data: payment, error } = await supabase
      .from("payments")
      .insert({
        id: randomUUID(),
        userId,
        subscriptionId: payload.subscriptionId ?? null,
        method: cleanMethod,
        receiptUrl: payload.receiptUrl || "https://ma-maison-niger.vercel.app/receipts/test.png",
        amount: payload.amount ?? 1500,
        status: "PENDING",
      } as any)
      .select()
      .single();

    if (error) throw new Error(`Échec de la soumission du paiement : ${error.message}`);
    return payment;
  }

  /**
   * Approves a payment request.
   * Updates payment.status = 'APPROVED', subscription extension and badgeVerified
   * are handled by the DB trigger on_payment_status_change → handle_payment_approved().
   */
  static async approvePayment(paymentId: string, adminId: string) {
    const supabaseAdmin = await createAdminClient();

    // Read first to check idempotence
    const { data: existingPayment, error: fetchError } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .single();

    if (fetchError || !existingPayment) {
      throw new Error("Paiement introuvable");
    }
    // Idempotence : une approbation déjà appliquée ne doit jamais ré-exécuter
    // la prolongation d'abonnement (double +30 jours).
    if (existingPayment.status === "APPROVED") {
      return existingPayment;
    }

    const { data: payment, error: updateError } = await supabaseAdmin
      .from("payments")
      .update({
        status: "APPROVED",
        validatedBy: adminId,
        validatedAt: new Date().toISOString(),
      } as any)
      .eq("id", paymentId)
      .select()
      .single();

    if (updateError) throw new Error(`Échec de l'approbation du paiement : ${updateError.message}`);

    // La prolongation de l'abonnement (+30 jours depuis GREATEST(now, endDate
    // actuel)) et le badgeVerified sont gérés par le trigger DB
    // on_payment_status_change → handle_payment_approved(), déclenché par le
    // changement de status ci-dessus. Le dupliquer ici provoquerait une double
    // prolongation (+60 jours) à chaque approbation.

    try {
      await AuditService.logAudit(adminId, "PAYMENT_APPROVED", paymentId, { amount: payment?.amount });
      if (payment?.userId) {
        await NotificationService.createNotification({
          userId: payment.userId,
          type: "PAYMENT_APPROVED",
          title: "Paiement approuvé",
          message: `Votre paiement de ${payment.amount} FCFA a été approuvé. Votre abonnement est maintenant actif pour 30 jours.`,
          link: "/dashboard/abonnement",
        });
      }
    } catch {
      // Notifications and audit are best-effort — never block payment approval
    }

    return payment;
  }

  /**
   * Rejects a payment request.
   */
  static async rejectPayment(paymentId: string, adminId: string, reason?: string) {
    const rejectionReason = reason || "Reçu de paiement invalide";
    const supabaseAdmin = await createAdminClient();

    const { data: payment, error } = await supabaseAdmin
      .from("payments")
      .update({
        status: "REJECTED",
        validatedBy: adminId,
        validatedAt: new Date().toISOString(),
        reference: rejectionReason,
      } as any)
      .eq("id", paymentId)
      .select()
      .single();

    if (error) throw new Error(`Échec du rejet du paiement : ${error.message}`);

    // Send notification to owner with rejection motif
    if (payment?.userId) {
      try {
        await NotificationService.createNotification({
          userId: payment.userId,
          type: "PAYMENT_REJECTED",
          title: "Paiement d'abonnement refusé",
          message: `Votre paiement de ${payment.amount || 1500} FCFA a été refusé. Motif : ${rejectionReason}`,
          link: "/dashboard/abonnement",
        });
      } catch (notifErr) {
        console.warn("Payment rejected notification warning:", notifErr);
      }
    }

    return payment;
  }
}
