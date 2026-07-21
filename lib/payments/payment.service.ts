import { createClient, createAdminClient } from "@/lib/supabase/server";
import { AuditService } from "@/lib/audit/audit.service";

export class PaymentService {
  /**
   * Submits a manual payment request (WAVE, AMANATA, MYNITA) for an owner.
   * Status initialized to PENDING.
   */
  static async submitPaymentRequest(userId: string, payload: { method: string; receiptUrl: string; amount?: number }) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("payments")
      .insert({
        user_id: userId,
        owner_id: userId,
        method: payload.method.toUpperCase(),
        provider: payload.method.toUpperCase(),
        receipt_url: payload.receiptUrl,
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
   * PostgreSQL trigger on_payment_approved handles atomic subscription update +30 days and badge verified.
   */
  static async approvePayment(paymentId: string, adminId: string) {
    const supabaseAdmin = await createAdminClient();
    const { data, error } = await supabaseAdmin
      .from("payments")
      .update({
        status: "APPROVED",
        validated_by: adminId,
        validated_at: new Date().toISOString(),
      } as any)
      .eq("id", paymentId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    await AuditService.logAudit(adminId, "PAYMENT_APPROVED", paymentId, { amount: data?.amount });
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
        admin_notes: reason ?? null,
        validated_by: adminId,
        validated_at: new Date().toISOString(),
      } as any)
      .eq("id", paymentId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    await AuditService.logAudit(adminId, "PAYMENT_REJECTED", paymentId, { reason });
    return data;
  }
}
