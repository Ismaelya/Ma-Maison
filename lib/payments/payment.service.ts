import { createClient, createAdminClient } from "@/lib/supabase/server";
import { AuditService } from "@/lib/audit/audit.service";
import { NotificationService } from "@/lib/notifications/notification.service";
import { randomUUID } from "crypto";

export class PaymentService {
  /**
   * Submits a manual payment request (WAVE, AMANATA, MYNITA) for an owner.
   * Status initialized to PENDING.
   */
  static async submitPaymentRequest(userId: string, payload: { method: string; receiptUrl: string; amount?: number; subscriptionId?: string }) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("payments")
      .insert({
        id: randomUUID(),
        userId,
        subscriptionId: payload.subscriptionId ?? null,
        method: (payload.method || (payload as any).operator || "WAVE").toUpperCase(),
        receiptUrl: payload.receiptUrl || "https://ma-maison-niger.vercel.app/receipts/test.png",
        amount: payload.amount ?? 1500,
        status: "PENDING",
      } as any)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Approves a payment request.
   * Section 53 spec: Simply updates payment.status = 'APPROVED'.
   * PostgreSQL trigger handle_payment_approved handles atomic subscription update +30 days and badge verified.
   */
  static async approvePayment(paymentId: string, adminId: string) {
    const supabaseAdmin = await createAdminClient();
    const { data, error } = await supabaseAdmin
      .from("payments")
      .update({
        status: "APPROVED",
        validatedBy: adminId,
        validatedAt: new Date().toISOString(),
      } as any)
      .eq("id", paymentId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    await AuditService.logAudit(adminId, "PAYMENT_APPROVED", paymentId, { amount: data?.amount });
    if (data?.userId) {
      await NotificationService.createNotification({
        userId: data.userId,
        type: "PAYMENT_APPROVED",
        title: "Paiement approuvé",
        message: `Votre paiement de ${data.amount} FCFA a été approuvé. Votre abonnement est maintenant actif pour 30 jours.`,
        link: "/dashboard/abonnement",
      });
    }
    return data;
  }

  /**
   * Rejects a payment request.
   */
  static async rejectPayment(paymentId: string, adminId: string, reason?: string) {
    const supabaseAdmin = await createAdminClient();
    const { data, error } = await supabaseAdmin
      .from("payments")
      .update({
        status: "REJECTED",
        validatedBy: adminId,
        validatedAt: new Date().toISOString(),
      } as any)
      .eq("id", paymentId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    await AuditService.logAudit(adminId, "PAYMENT_REJECTED", paymentId, { reason });
    if (data?.userId) {
      await NotificationService.createNotification({
        userId: data.userId,
        type: "PAYMENT_REJECTED",
        title: "Paiement rejeté",
        message: `Votre paiement de ${data.amount} FCFA n'a pas pu être validé.${reason ? ` Motif: ${reason}` : ""}`,
        link: "/dashboard/abonnement",
      });
    }
    return data;
    return data;
  }
}
