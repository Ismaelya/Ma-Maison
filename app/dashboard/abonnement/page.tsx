import type { Metadata } from "next";
import { CheckCircle2, ShieldCheck, CreditCard, XCircle, Clock } from "lucide-react";
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

  // 1. Fetch AppSettings (payment numbers + premiumEnabled flag)
  const { data: appSettings } = await supabase
    .from("app_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  const rawPhoneNumbers = (appSettings?.paymentPhoneNumbers as any) ?? {};
  const wavePhone = rawPhoneNumbers.wave ?? "+227 96 70 71 16";
  const amanataPhone = rawPhoneNumbers.amanata ?? "+227 96 70 71 16";
  const mynitaPhone = rawPhoneNumbers.mynita ?? "+227 96 70 71 16";
  const subPrice = appSettings?.subscriptionPrice ?? 1500;

  // premiumEnabled : default true si la colonne n'existe pas encore (sécurité montante)
  const premiumEnabled: boolean = appSettings?.premiumEnabled !== false;

  // 2. Fetch active / trial subscription if available
  const { data: activeSub } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("userId", profile.id)
    .order("createdAt", { ascending: false })
    .limit(1)
    .maybeSingle();

  // 3. Fetch payment request history
  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("userId", profile.id)
    .order("createdAt", { ascending: false });

  const paymentList = (payments ?? []) as Payment[];
  const trialDays = activeSub?.endDate ? getTrialDaysRemaining(activeSub.endDate) : null;
  const status = String(activeSub?.status ?? "FREE").toLowerCase();

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
          Mon abonnement
        </h1>
        <p className="mt-1 text-neutral-600">
          {premiumEnabled
            ? "Gérez votre formule et vos paiements Premium"
            : "Votre formule d'abonnement actuelle"}
        </p>
      </div>

      {/* ── MODE PAUSE PREMIUM ─────────────────────────────────────────────── */}
      {!premiumEnabled ? (
        <div className="space-y-6">
          {/* Subscription Status Header (Gratuit seulement) */}
          <div
            className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-[var(--shadow-card)]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                  Compte Gratuit
                </span>
              </div>
            </div>
            <div className="mt-6">
              <p className="text-sm font-semibold text-blue-900">
                Compte Gratuit — publication illimitée, visibilité normale.
              </p>
            </div>
          </div>

          {/* Bannière "bientôt disponible" */}
          <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-8 text-center shadow-[var(--shadow-card)]">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-amber-900">Premium — Bientôt disponible</h2>
            <p className="mt-3 text-sm text-amber-800 leading-relaxed max-w-md mx-auto">
              L&apos;abonnement Premium arrive bientôt sur Ma Maison !{" "}
              En attendant, profitez de la <strong>publication illimitée</strong> en mode Gratuit.
            </p>
          </div>
        </div>
      ) : (
        /* ── MODE NORMAL PREMIUM ────────────────────────────────────────────── */
        <>
          {/* Subscription Status Header */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Status card */}
            <div
              className={cn(
                "rounded-2xl border p-6 shadow-[var(--shadow-card)] md:col-span-2",
                status === "active"
                  ? "border-green-200 bg-gradient-to-br from-green-50 to-emerald-50"
                  : status === "free"
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
                        : status === "free"
                          ? "bg-blue-600 text-white"
                          : "bg-red-600 text-white"
                    )}
                  >
                    {status === "active"
                      ? "Formule Premium Active"
                      : status === "free"
                        ? "Compte Gratuit"
                        : "Abonnement Expiré"}
                  </span>
                  {(profile.badgeVerified || (profile as any).badge_verified) && (
                    <span className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                      <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                      Badge Vérifié
                    </span>
                  )}
                </div>
                <span className="text-2xl font-extrabold text-neutral-900">
                  {formatPrice(subPrice)} <span className="text-xs font-normal text-neutral-500">/mois</span>
                </span>
              </div>

              <div className="mt-6">
                {status === "active" && (activeSub?.endDate || activeSub?.expires_at) ? (
                  <div>
                    <p className="text-sm font-semibold text-green-900">
                      Votre abonnement Premium est valide jusqu&apos;au {formatDate(activeSub.endDate || activeSub.expires_at)}.
                    </p>
                    <p className="mt-1 text-xs text-green-700">
                      Vos annonces bénéficient de la visibilité normale et du badge propriétaire vérifié.
                    </p>
                  </div>
                ) : status === "free" ? (
                  <div>
                    <p className="text-sm font-semibold text-blue-900">
                      Compte Gratuit — publication illimitée, visibilité normale, 10 messages/jour.
                    </p>
                    <p className="mt-1 text-xs text-blue-700">
                      Passez en Premium pour obtenir le badge vérifié, la mise en avant, les statistiques de vues et la messagerie illimitée.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-semibold text-red-900">
                      Votre abonnement Premium n&apos;est plus actif. Vous conservez votre accès Gratuit et pouvez continuer à publier.
                    </p>
                    <p className="mt-1 text-xs text-red-700">
                      Vous pouvez souscrire à nouveau à tout moment pour retrouver les avantages Premium.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Benefits Card */}
            <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-card)]">
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500">
                Gratuit vs Premium
              </h3>
              <div className="mt-4 overflow-hidden rounded-xl border border-neutral-200">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50">
                      <th className="px-3 py-2.5 text-left font-semibold text-neutral-600">Fonctionnalité</th>
                      <th className="px-3 py-2.5 text-center font-semibold text-blue-600">Gratuit</th>
                      <th className="px-3 py-2.5 text-center font-semibold text-primary-600">Premium</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-neutral-700">
                    <tr>
                      <td className="px-3 py-2.5">Publication d&apos;annonces</td>
                      <td className="px-3 py-2.5 text-center">
                        <CheckCircle2 className="h-4 w-4 text-green-500 inline" />
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <CheckCircle2 className="h-4 w-4 text-green-500 inline" />
                      </td>
                    </tr>
                    <tr className="bg-neutral-50/50">
                      <td className="px-3 py-2.5">Badge vérifié</td>
                      <td className="px-3 py-2.5 text-center">
                        <XCircle className="h-4 w-4 text-neutral-300 inline" />
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <CheckCircle2 className="h-4 w-4 text-green-500 inline" />
                      </td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2.5">Mise en avant &amp; statistiques</td>
                      <td className="px-3 py-2.5 text-center">
                        <XCircle className="h-4 w-4 text-neutral-300 inline" />
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <CheckCircle2 className="h-4 w-4 text-green-500 inline" />
                      </td>
                    </tr>
                    <tr className="bg-amber-50/60">
                      <td className="px-3 py-2.5 font-semibold text-neutral-800">Messagerie</td>
                      <td className="px-3 py-2.5 text-center font-semibold text-amber-700">10 msg/jour</td>
                      <td className="px-3 py-2.5 text-center font-semibold text-primary-700">Illimitée</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-4 rounded-xl border border-primary-200 bg-primary-50 p-4 text-sm text-primary-800">
                <p className="font-semibold">Passer Premium</p>
                <p className="mt-1 text-xs text-primary-700">Le bouton de paiement reste toujours disponible pour souscrire ou renouveler à tout moment.</p>
              </div>
            </div>
          </div>

          {/* Manual Payment Instructions & Upload */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Instructions (Payment phone numbers from AppSettings) */}
            <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-card)] space-y-6">
              <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary-600" />
                Instructions de paiement manuel
              </h2>

              <p className="text-sm text-neutral-600 leading-relaxed">
                Pour souscrire ou renouveler votre abonnement Premium ({formatPrice(subPrice)} / mois),
                effectuez le dépôt du montant exact vers l&apos;un des comptes ci-dessous :
              </p>

              <div className="space-y-3">
                <div className="rounded-xl border border-orange-200 bg-orange-50/50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white p-1 shadow-sm border border-orange-100">
                        <img src="/images/amana.jpg" alt="Amanata" className="h-full w-full object-contain" />
                      </div>
                      <span className="font-bold text-orange-900">Amanata</span>
                    </div>
                    <span className="rounded-lg bg-orange-200/80 px-3 py-1 text-xs font-bold text-orange-800">
                      {amanataPhone}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-orange-700"></p>
                </div>

                <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white p-1 shadow-sm border border-purple-100">
                        <img src="/images/nita.png" alt="Mynita" className="h-full w-full object-contain" />
                      </div>
                      <span className="font-bold text-purple-900">Mynita</span>
                    </div>
                    <span className="rounded-lg bg-purple-200/80 px-3 py-1 text-xs font-bold text-purple-800">
                      {mynitaPhone}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-purple-700"></p>
                </div>

                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white p-1 shadow-sm border border-blue-100">
                        <img src="/images/wave.png" alt="Wave" className="h-full w-full object-contain" />
                      </div>
                      <span className="font-bold text-blue-900">Wave</span>
                    </div>
                    <span className="rounded-lg bg-blue-200/80 px-3 py-1 text-xs font-bold text-blue-800">
                      {wavePhone}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-blue-700"></p>
                </div>
              </div>

              <div className="rounded-xl bg-neutral-100 p-4 text-xs text-neutral-600 space-y-1">
                <p className="font-semibold text-neutral-900">Procédure de validation :</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Effectuez le virement de {formatPrice(subPrice)}</li>
                  <li>Prenez une capture d&apos;écran ou une photo nette du reçu</li>
                  <li>Téléversez le reçu dans le formulaire ci-contre</li>
                </ol>
              </div>
            </div>

            {/* Upload Form */}
            <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-card)]">
              <h2 className="text-lg font-bold text-neutral-900 mb-4">
                Soumettre le reçu de paiement
              </h2>
              <ReceiptUploadForm />
            </div>
          </div>
        </>
      )}

      {/* Payment History — visible dans les deux modes */}
      {paymentList.length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-lg font-bold text-neutral-900 mb-4">
            Historique de vos paiements
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs font-semibold uppercase text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Méthode</th>
                  <th className="px-4 py-3">Montant</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                {paymentList.map((p: any) => {
                  const pStatus = String(p.status).toLowerCase();
                  return (
                    <tr key={p.id}>
                      <td className="px-4 py-3 font-semibold uppercase">
                        {p.method || p.provider}
                      </td>
                      <td className="px-4 py-3 font-bold text-neutral-900">
                        {formatPrice(p.amount)}
                      </td>
                      <td className="px-4 py-3 text-xs text-neutral-500">
                        {formatDate(p.createdAt || p.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-bold uppercase",
                            pStatus === "approved" || pStatus === "active"
                              ? "bg-green-100 text-green-700"
                              : pStatus === "pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                          )}
                        >
                          {pStatus === "approved" ? "Validé" : pStatus === "pending" ? "En attente" : "Refusé"}
                        </span>
                        {pStatus === "rejected" && p.reference && (
                          <p className="mt-1 text-[11px] font-medium text-red-600 italic">
                            Motif : {p.reference}
                          </p>
                        )}
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
  );
}
