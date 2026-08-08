import { createClient, createAdminClient } from "@/lib/supabase/server";
import { AuditService } from "@/lib/audit/audit.service";
import { NotificationService } from "@/lib/notifications/notification.service";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma/client";

export class PaymentService {
  /**
   * Submits a manual payment request (WAVE, AMANATA, MYNITA) for an owner.
   * Status initialized to PENDING.
   */
  static async submitPaymentRequest(userId: string, payload: { method: string; receiptUrl: string; amount?: number; subscriptionId?: string }) {
    let cleanMethod = (payload.method || (payload as any).operator || "WAVE").toUpperCase();
    if (!["AMANATA", "MYNITA", "WAVE"].includes(cleanMethod)) {
      cleanMethod = "WAVE";
    }

    let payment: any = null;
    const paymentId = randomUUID();

    try {
      payment = await prisma.payment.create({
        data: {
          id: paymentId,
          userId,
          subscriptionId: payload.subscriptionId ?? null,
          method: cleanMethod as any,
          receiptUrl: payload.receiptUrl || "https://ma-maison-niger.vercel.app/receipts/test.png",
          amount: payload.amount ?? 1500,
          status: "PENDING",
        },
      });
    } catch {
      // Ignore Prisma error
    }

    if (!payment) {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("payments")
        .insert({
          id: paymentId,
          userId,
          subscriptionId: payload.subscriptionId ?? null,
          method: cleanMethod,
          receiptUrl: payload.receiptUrl || "https://ma-maison-niger.vercel.app/receipts/test.png",
          amount: payload.amount ?? 1500,
          status: "PENDING",
        } as any)
        .select()
        .single();

      if (error && !payment) throw new Error(error.message);
      payment = data;
    }

    return payment;
  }

  /**
   * Approves a payment request.
   * Updates payment.status = 'APPROVED', extends subscription by +30 days, and sets badgeVerified = true.
   */
  static async approvePayment(paymentId: string, adminId: string) {
    let existingPayment: any = null;
    try {
      existingPayment = await prisma.payment.findUnique({ where: { id: paymentId } });
    } catch {
      // Ignore Prisma error
    }
    if (!existingPayment) {
      const supabaseAdmin = await createAdminClient();
      const { data } = await supabaseAdmin.from("payments").select("*").eq("id", paymentId).single();
      existingPayment = data;
    }

    if (!existingPayment) {
      throw new Error("Paiement introuvable");
    }
    // Idempotence : une approbation déjà appliquée ne doit jamais ré-exécuter
    // la prolongation d'abonnement (double +30 jours).
    if (existingPayment.status === "APPROVED") {
      return existingPayment;
    }

    let payment: any = null;

    try {
      payment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: "APPROVED",
          validatedBy: adminId,
          validatedAt: new Date(),
        },
      });
    } catch {
      // Ignore Prisma error
    }

    if (!payment) {
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

      if (error && !payment) throw new Error(error.message);
      payment = data;
    }

    // La prolongation de l'abonnement (+30 jours depuis GREATEST(now, endDate
    // actuel)) et le badgeVerified sont gérés par le trigger DB
    // on_payment_status_change → handle_payment_approved(), déclenché par le
    // changement de status ci-dessus (Prisma ou Supabase). Le dupliquer ici
    // provoquait une double prolongation (+60 jours) à chaque approbation.

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
      // Optional logging
    }

    return payment;
  }

  /**
   * Rejects a payment request.
   */
  static async rejectPayment(paymentId: string, adminId: string, reason?: string) {
    let payment: any = null;
    const rejectionReason = reason || "Reçu de paiement invalide";

    try {
      payment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: "REJECTED",
          validatedBy: adminId,
          validatedAt: new Date(),
          reference: rejectionReason,
        },
      });
    } catch {
      // Ignore Prisma error
    }

    if (!payment) {
      const supabaseAdmin = await createAdminClient();
      const { data, error } = await supabaseAdmin
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

      if (error && !payment) throw new Error(error.message);
      payment = data;
    }

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
