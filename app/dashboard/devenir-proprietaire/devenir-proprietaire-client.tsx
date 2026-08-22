"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast-notification";
import {
  Building2,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  Loader2,
  UserCheck,
} from "lucide-react";

export function DevenirProprietaireClient({ userName }: { userName?: string }) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();
  const toast = useToast();

  async function handleUpgrade() {
    setLoading(true);
    setErrorMsg(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("upgrade_to_owner");

      if (error) {
        console.error("Erreur upgrade_to_owner:", error);
        setErrorMsg(error.message || "Impossible d'effectuer le changement de rôle.");
        toast.error(error.message || "Une erreur est survenue.");
        setLoading(false);
        return;
      }

      toast.success("Félicitations ! Votre compte est maintenant Propriétaire 🎉");
      router.push("/dashboard/annonces/nouveau?welcome=1");
      router.refresh();
    } catch (err: any) {
      console.error("Exception upgrade_to_owner:", err);
      const msg = err.message || "Erreur de connexion.";
      setErrorMsg(msg);
      toast.error(msg);
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 animate-fade-in text-left pb-12">
      {/* Banner Hero Immersif */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#102281] via-[#0C2D9A] to-[#05CBAD] p-8 sm:p-12 text-white shadow-2xl">
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur-md border border-white/20">
            <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
            <span>Changement de Rôle — Instantané & Gratuit</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-space-grotesk leading-tight text-white">
            Devenez Propriétaire sur Ma Maison
          </h1>

          <p className="text-sm sm:text-base text-cyan-50 font-medium leading-relaxed opacity-95">
            {userName ? `Bonjour ${userName} ! ` : ""}Vous souhaitez mettre en location ou en vente un bien immobilier au Niger ? Activez votre profil Propriétaire dès maintenant pour créer vos premières annonces.
          </p>
        </div>
      </div>

      {/* Error display */}
      {errorMsg && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {errorMsg}
        </div>
      )}

      {/* Avantages */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg)] p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="h-12 w-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Building2 className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-[var(--color-text)]">
            Publication Illimitée & Gratuite
          </h3>
          <p className="text-sm text-neutral-500 leading-relaxed">
            Publiez et gérez toutes vos offres de location ou de vente. Vos annonces sont visibles immédiatement par des milliers d&apos;utilisateurs actifs à Niamey, Zinder, Maradi et dans tout le Niger.
          </p>
          <ul className="space-y-2 pt-2 text-xs font-medium text-[var(--color-text)]">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
              <span>Publication d&apos;annonces 100% gratuite</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
              <span>Prise de contact directe via WhatsApp & téléphone</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
              <span>Gestion complète depuis votre tableau de bord</span>
            </li>
          </ul>
        </div>

        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg)] p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="h-12 w-12 rounded-2xl bg-sky-100 dark:bg-sky-950/50 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-[var(--color-text)]">
            Badge Vérifié en option Premium
          </h3>
          <p className="text-sm text-neutral-500 leading-relaxed">
            Profitez en option des fonctionnalités Premium pour certifier votre identité, obtenir le badge &quot;Propriétaire Vérifié&quot; et maximiser le taux de réponse de vos annonces.
          </p>
          <ul className="space-y-2 pt-2 text-xs font-medium text-[var(--color-text)]">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-sky-500 flex-shrink-0" />
              <span>Badge de confiance sur vos annonces</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-sky-500 flex-shrink-0" />
              <span>Positionnement prioritaire sur la plateforme</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-sky-500 flex-shrink-0" />
              <span>Assistance dédiée aux propriétaires</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Action CTA */}
      <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg)] p-8 text-center space-y-6 shadow-md">
        <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-r from-[#102281] to-[#05CBAD] flex items-center justify-center text-white shadow-lg">
          <UserCheck className="h-8 w-8" />
        </div>
        <div className="space-y-2 max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-[var(--color-text)]">
            Prêt à publier votre première annonce ?
          </h2>
          <p className="text-xs text-neutral-500">
            En cliquant sur ce bouton, votre compte passe instantanément au rôle Propriétaire sans altérer vos favoris ou messages existants.
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={handleUpgrade}
            disabled={loading}
            className="inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#102281] to-[#05CBAD] px-8 py-4 text-base font-extrabold text-white shadow-xl hover:opacity-95 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Conversion en cours...</span>
              </>
            ) : (
              <>
                <Zap className="h-5 w-5 fill-yellow-300 text-yellow-300" />
                <span>Devenir Propriétaire</span>
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
