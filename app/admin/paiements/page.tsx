import type { Metadata } from "next";
import { CreditCard, CheckCircle2, XCircle, Clock } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { formatPrice, formatDate, cn } from "@/lib/utils";
import { PaymentVerificationModal } from "@/components/admin/payment-verification-modal";
import type { PaymentWithOwner } from "@/types";

export const metadata: Metadata = {
  title: "Vérification des paiements — Admin",
};

export default async function AdminPaymentsPage() {
  const supabase = await createAdminClient();

  const { data: paymentsData, error } = await supabase
    .from("payments")
    .select("*, profiles!inner(id, full_name, email, phone)")
    .order("created_at", { ascending: false });

  const payments = (paymentsData ?? []) as PaymentWithOwner[];

  const pendingPayments = payments.filter((p) => p.status === "pending");
  const processedPayments = payments.filter((p) => p.status !== "pending");

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Vérification des paiements</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Validez les demandes d&apos;abonnement Premium (1 500 FCFA) après vérification du reçu
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-800 bg-red-950/50 p-4 text-sm text-red-300">
          Erreur lors du chargement des demandes de paiement.
        </div>
      )}

      {/* Pending Payments Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-yellow-400 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Demandes en attente ({pendingPayments.length})
        </h2>

        {pendingPayments.length === 0 ? (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-8 text-center text-sm text-neutral-500">
            Aucune demande de paiement en attente.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-neutral-300">
                <thead className="bg-neutral-900 text-xs uppercase text-neutral-400">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Propriétaire</th>
                    <th className="px-6 py-4 font-semibold">Méthode</th>
                    <th className="px-6 py-4 font-semibold">Montant</th>
                    <th className="px-6 py-4 font-semibold">Date de soumission</th>
                    <th className="px-6 py-4 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {pendingPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-neutral-900/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-white">
                          {p.profiles.full_name ?? "Sans nom"}
                        </p>
                        <p className="text-xs text-neutral-400">{p.profiles.email}</p>
                        {p.profiles.phone && (
                          <p className="text-xs text-neutral-500">📞 {p.profiles.phone}</p>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span className="rounded-full bg-yellow-950 text-yellow-400 border border-yellow-800 px-3 py-1 text-xs font-bold uppercase">
                          {p.provider}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-bold text-white">
                        {formatPrice(p.amount)}
                      </td>

                      <td className="px-6 py-4 text-xs text-neutral-400">
                        {formatDate(p.created_at)}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <PaymentVerificationModal payment={p} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Processed Payments History */}
      <div className="space-y-4 pt-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          Historique des paiements traités ({processedPayments.length})
        </h2>

        {processedPayments.length === 0 ? (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-8 text-center text-sm text-neutral-500">
            Aucun paiement traité pour l&apos;instant.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-neutral-300">
                <thead className="bg-neutral-900 text-xs uppercase text-neutral-400">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Propriétaire</th>
                    <th className="px-6 py-4 font-semibold">Méthode</th>
                    <th className="px-6 py-4 font-semibold">Montant</th>
                    <th className="px-6 py-4 font-semibold">Statut</th>
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 text-right font-semibold">Reçu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {processedPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-neutral-900/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-white">
                          {p.profiles.full_name ?? "Sans nom"}
                        </p>
                        <p className="text-xs text-neutral-400">{p.profiles.email}</p>
                      </td>

                      <td className="px-6 py-4 text-xs font-semibold uppercase text-neutral-300">
                        {p.provider}
                      </td>

                      <td className="px-6 py-4 font-bold text-white">
                        {formatPrice(p.amount)}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-bold uppercase",
                            p.status === "approved"
                              ? "bg-green-950 text-green-400 border border-green-800"
                              : "bg-red-950 text-red-400 border border-red-800"
                          )}
                        >
                          {p.status === "approved" ? "Validé" : "Refusé"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-xs text-neutral-400">
                        {formatDate(p.created_at)}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <PaymentVerificationModal payment={p} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
