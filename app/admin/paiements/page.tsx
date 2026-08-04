import type { Metadata } from "next";
import { Clock, AlertTriangle } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { formatPrice, formatDate, cn } from "@/lib/utils";
import { PaymentVerificationModal } from "@/components/admin/payment-verification-modal";

export const metadata: Metadata = {
  title: "Vérification des paiements — Admin",
};

export default async function AdminPaymentsPage() {
  const supabase = await createAdminClient();

  // Fetch premiumEnabled flag
  const { data: appSettings } = await supabase
    .from("app_settings")
    .select("premiumEnabled")
    .limit(1)
    .maybeSingle();

  const premiumEnabled: boolean = appSettings?.premiumEnabled !== false;

  const { data: paymentsData, error } = await supabase
    .from("payments")
    .select("*, user:profiles!userId(id, name, email, phone)")
    .order("createdAt", { ascending: false });

  const payments = (paymentsData ?? []) as any[];

  const pendingPayments = payments.filter((p) => String(p.status).toUpperCase() === "PENDING");
  const processedPayments = payments.filter((p) => String(p.status).toUpperCase() !== "PENDING");

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Vérification des paiements</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Validez les demandes d&apos;abonnement Premium (1 500 FCFA) après vérification du reçu
        </p>
      </div>

      {/* Bandeau mode Premium désactivé */}
      {!premiumEnabled && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-700/50 bg-amber-950/40 px-5 py-4 text-sm text-amber-300">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
          <span>
            <strong className="font-semibold text-amber-200">Mode Premium actuellement désactivé</strong>
            {" "}— Les nouvelles demandes de paiement sont bloquées côté propriétaire. Aucune nouvelle soumission attendue tant que{" "}
            <code className="rounded bg-amber-900/60 px-1.5 py-0.5 text-xs font-mono text-amber-300">premiumEnabled = false</code>.
          </span>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-800 bg-red-950/50 p-4 text-sm text-red-300">
          Erreur lors du chargement des demandes de paiement : {error.message}
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
                  {pendingPayments.map((p) => {
                    const profile = p.user || {};
                    return (
                      <tr key={p.id} className="hover:bg-neutral-900/50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-white">
                            {profile.name || "Sans nom"}
                          </p>
                          <p className="text-xs text-neutral-400">{profile.email}</p>
                          {profile.phone && (
                            <p className="text-xs text-neutral-500">📞 {profile.phone}</p>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <span className="rounded-full bg-yellow-950 text-yellow-400 border border-yellow-800 px-3 py-1 text-xs font-bold uppercase">
                            {p.method || p.provider}
                          </span>
                        </td>

                        <td className="px-6 py-4 font-bold text-white">
                          {formatPrice(p.amount)}
                        </td>

                        <td className="px-6 py-4 text-xs text-neutral-400">
                          {formatDate(p.createdAt || p.created_at)}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <PaymentVerificationModal payment={p} />
                        </td>
                      </tr>
                    );
                  })}
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
            Aucun paiement traité pour l'instant.
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
                  {processedPayments.map((p) => {
                    const profile = p.user || {};
                    const isApproved = String(p.status).toUpperCase() === "APPROVED";

                    return (
                      <tr key={p.id} className="hover:bg-neutral-900/50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-white">
                            {profile.name || "Sans nom"}
                          </p>
                          <p className="text-xs text-neutral-400">{profile.email}</p>
                        </td>

                        <td className="px-6 py-4 text-xs font-semibold uppercase text-neutral-300">
                          {p.method || p.provider}
                        </td>

                        <td className="px-6 py-4 font-bold text-white">
                          {formatPrice(p.amount)}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-1 text-xs font-bold uppercase",
                              isApproved
                                ? "bg-green-950 text-green-400 border border-green-800"
                                : "bg-red-950 text-red-400 border border-red-800"
                            )}
                          >
                            {isApproved ? "Validé" : "Refusé"}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-xs text-neutral-400">
                          {formatDate(p.createdAt || p.created_at)}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <PaymentVerificationModal payment={p} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
