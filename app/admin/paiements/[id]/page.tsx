import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { PaymentVerificationModal } from "@/components/admin/payment-verification-modal";
import type { PaymentWithOwner } from "@/types";

export const metadata: Metadata = {
  title: "Vérification du paiement — Admin",
};

export default async function AdminPaymentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createAdminClient();

  const { data: payment } = await supabase
    .from("payments")
    .select("*, profiles!inner(id, name, email, phone)")
    .eq("id", id)
    .single();

  if (!payment) {
    notFound();
  }

  return (
    <div className="animate-fade-in space-y-6">
      <Link
        href="/admin/paiements"
        className="inline-flex items-center gap-2 text-sm font-medium text-neutral-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux paiements
      </Link>

      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-xl space-y-6">
        <h1 className="text-xl font-bold text-white">Détail du paiement</h1>
        <PaymentVerificationModal payment={payment as PaymentWithOwner} />
      </div>
    </div>
  );
}
