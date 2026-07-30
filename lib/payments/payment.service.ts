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

    // Extend Subscription by 30 days and mark badge verified
    if (payment?.userId) {
      try {
        const now = new Date();
        const expiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        await prisma.subscription.upsert({
          where: { userId: payment.userId },
          update: {
            status: "ACTIVE",
            endDate: expiry,
          },
          create: {
            userId: payment.userId,
            status: "ACTIVE",
            price: payment.amount || 25000,
            startDate: now,
            endDate: expiry,
          },
        });

        await prisma.profile.update({
          where: { id: payment.userId },
          data: { badgeVerified: true },
        });
      } catch (subErr) {
        console.warn("Approve payment sub sync warning:", subErr);
      }
    }

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

    try {
      payment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: "REJECTED",
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
          status: "REJECTED",
          validatedBy: adminId,
          validatedAt: new Date().toISOString(),
        } as any)
        .eq("id", paymentId)
        .select()
        .single();

      if (error && !payment) throw new Error(error.message);
      payment = data;
    }

    return payment;
  }
}
