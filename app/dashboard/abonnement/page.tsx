import type { Metadata } from "next";
import { CheckCircle2, Clock, AlertTriangle, ShieldCheck, CreditCard, ArrowRight } from "lucide-react";
import { requireRole } from "@/lib/auth/helpers";
import { createClient } from "@/lib/supabase/server";
import { getTrialDaysRemaining, formatDate, formatPrice, cn } from "@/lib/utils";
import { ReceiptUploadForm } from "@/components/dashboard/receipt-upload-form";
import type { Payment } from "@/types";

export const metadata: Metadata = {
  title: "Mon abonnement",
};

export default async function SubscriptionPage() {
  const { profile } = await requireRole("owner");
  const supabase = await createClient();

  // Fetch active subscription if available
  const { data: activeSub } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("owner_id", profile.id)
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: false })
    .limit(1)
    .single();

  // Fetch payment request history
  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("owner_id", profile.id)
    .order("created_at", { ascending: false });

  const paymentList = (payments ?? []) as Payment[];
  const trialDays = getTrialDaysRemaining(profile.trial_started_at);
  const status = profile.subscription_status;

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
          Mon abonnement
        </h1>
        <p className="mt-1 text-neutral-600">
          Gérez votre formule et vos paiements Premium
        </p>
      </div>

      {/* Subscription Status Header */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Status card */}
        <div
          className={cn(
            "rounded-2xl border p-6 shadow-[var(--shadow-card)] md:col-span-2",
            status === "active"
              ? "border-green-200 bg-gradient-to-br from-green-50 to-emerald-50"
              : status === "trial"
                ? "border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50"
                : "border-red-200 bg-gradient-to-br from-red-50 to-rose-50"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider",
                  status === "active"
                    ? "bg-green-600 text-white"
                    : status === "trial"
                      ? "bg-blue-600 text-white"
                      : "bg-red-600 text-white"
                )}
              >
                {status === "active"
                  ? "Formule Premium Active"
                  : status === "trial"
                    ? "Essai Gratuit"
                    : "Abonnement Expiré"}
              </span>
              {profile.badge_verified && (
                <span className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                  Badge Vérifié
                </span>
              )}
            </div>
            <span className="text-2xl font-extrabold text-neutral-900">
              {formatPrice(1500)} <span className="text-xs font-normal text-neutral-500">/mois</span>
            </span>
          </div>

          <div className="mt-6">
            {status === "active" && activeSub?.expires_at ? (
              <div>
                <p className="text-sm font-semibold text-green-900">
                  Votre abonnement Premium est valide jusqu&apos;au {formatDate(activeSub.expires_at)}.
                </p>
                <p className="mt-1 text-xs text-green-700">
                  Vos annonces bénéficient de la visibilité normale et du badge propriétaire vérifié.
                </p>
              </div>
            ) : status === "trial" ? (
              <div>
                <p className="text-sm font-semibold text-blue-900">
                  Période d&apos;essai gratuite : {trialDays} jour{trialDays > 1 ? "s" : ""} restant{trialDays > 1 ? "s" : ""}.
                </p>
                <p className="mt-1 text-xs text-blue-700">
                  Profitez de la publication illimitée et recevez des messages de locataires.
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-semibold text-red-900">
                  Votre période d&apos;essai a expiré. Vos annonces ne sont plus visibles publiquement.
                </p>
                <p className="mt-1 text-xs text-red-700">
                  Soumettez votre reçu de paiement ci-dessous pour réactiver vos annonces sous 24h.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Benefits Card */}
        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-card)]">
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500">
            Avantages Premium
          </h3>
          <ul className="mt-4 space-y-2 text-xs text-neutral-700">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-secondary-600 flex-shrink-0" />
              Publication d&apos;annonces illimitée
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-secondary-600 flex-shrink-0" />
              Badge propriétaire vérifié
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-secondary-600 flex-shrink-0" />
              Messagerie directe avec locataires
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-secondary-600 flex-shrink-0" />
              Support client prioritaire
            </li>
          </ul>
        </div>
      </div>

      {/* Manual Payment Instructions & Upload */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Instructions */}
        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-card)] space-y-6">
          <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary-600" />
            Instructions de paiement manuel
          </h2>

          <p className="text-sm text-neutral-600 leading-relaxed">
            Pour souscrire ou renouveler votre abonnement Premium (**1 500 FCFA / mois**),
            effectuez le virement du montant exact vers l&apos;un des comptes suivants :
          </p>

          <div className="space-y-3">
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-900">Wave Niger</span>
                <span className="rounded bg-blue-200 px-2 py-0.5 text-xs font-bold text-blue-800">
                  +227 90 00 00 01
                </span>
              </div>
              <p className="mt-1 text-xs text-blue-700">Nom du compte : Ma Maison NE</p>
            </div>

            <div className="rounded-xl border border-orange-200 bg-orange-50/50 p-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-orange-900">Amanata Mobile</span>
                <span className="rounded bg-orange-200 px-2 py-0.5 text-xs font-bold text-orange-800">
                  +227 96 00 00 02
                </span>
              </div>
              <p className="mt-1 text-xs text-orange-700">Nom du compte : Ma Maison NE</p>
            </div>

            <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-900">Mynita Service</span>
                <span className="rounded bg-purple-200 px-2 py-0.5 text-xs font-bold text-purple-800">
                  +227 98 00 00 03
                </span>
              </div>
              <p className="mt-1 text-xs text-purple-700">Nom du compte : Ma Maison NE</p>
            </div>
          </div>

          <div className="rounded-xl bg-neutral-100 p-4 text-xs text-neutral-600 space-y-1">
            <p className="font-semibold text-neutral-900">Procédure de validation :</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Effectuez le virement de **1 500 FCFA**</li>
              <li>Prenez une capture d&apos;écran ou une photo nette du reçu</li>
              <li>Téléversez le reçu dans le formulaire ci-contre</li>
              <li>L&apos;administration valide sous 24 heures max</li>
            </ol>
          </div>
        </div>

        {/* Upload form */}
        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-lg font-bold text-neutral-900 mb-6">
            Envoyer votre reçu de paiement
          </h2>
          <ReceiptUploadForm />
        </div>
      </div>

      {/* Payment History */}
      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-card)]">
        <h2 className="text-lg font-bold text-neutral-900 mb-4">
          Historique de vos demandes de paiement
        </h2>

        {paymentList.length === 0 ? (
          <p className="py-8 text-center text-sm text-neutral-500">
            Aucune demande de paiement soumise pour l&apos;instant.
          </p>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {paymentList.map((pay: any) => (
              <div key={pay.id} className="flex items-center justify-between py-4">
                <div>
                  <p className="font-semibold text-sm text-neutral-900">
                    Paiement {(pay.method || pay.provider || "wave").toUpperCase()} — {formatPrice(pay.amount)}
                  </p>
                  <p className="text-xs text-neutral-500">
                    Soumis le {formatDate(pay.created_at)}
                  </p>
                  {pay.admin_notes && (
                    <p className="mt-1 text-xs text-red-600">
                      Note admin : {pay.admin_notes}
                    </p>
                  )}
                </div>

                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-bold uppercase",
                    pay.status === "approved"
                      ? "bg-green-100 text-green-700"
                      : pay.status === "rejected"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                  )}
                >
                  {pay.status === "approved"
                    ? "Validé"
                    : pay.status === "rejected"
                      ? "Refusé"
                      : "En attente"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
