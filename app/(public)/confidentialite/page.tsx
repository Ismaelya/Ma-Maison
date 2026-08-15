import { Metadata } from "next";
import Link from "next/link";
import { Lock, Database, EyeOff, Clock, UserX, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Politique de Confidentialité | Ma Maison Niger",
  description: "Découvrez comment Ma Maison Niger collecte, utilise et protège vos données personnelles.",
};

export default function ConfidentialitePage() {
  return (
    <div className="bg-stone-50 min-h-screen py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="rounded-3xl bg-neutral-900 p-8 sm:p-12 text-white shadow-xl mb-10">
          <div className="flex items-center gap-3 text-[var(--color-secondary-400)] mb-3">
            <Lock className="h-6 w-6" />
            <span className="text-xs font-semibold uppercase tracking-wider">Protection des données</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold font-heading">
            Politique de Confidentialité
          </h1>
          <p className="mt-3 text-sm sm:text-base text-neutral-300 max-w-2xl font-sans">
            Dernière mise à jour : 15 août 2026. Chez Ma Maison Niger, la protection et la transparence concernant vos données personnelles sont au cœur de nos priorités.
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8 rounded-3xl bg-white p-6 sm:p-10 border border-stone-200 shadow-sm text-stone-800 font-sans leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-neutral-900 font-bold font-heading text-lg sm:text-xl border-b pb-2 border-stone-100">
              <Database className="h-5 w-5 text-[var(--color-primary-text)]" />
              <h2>1. Données collectées</h2>
            </div>
            <p className="text-sm sm:text-base text-stone-600">
              Dans le cadre de l&apos;utilisation de notre service, nous collectons les données strictement nécessaires au bon fonctionnement de la plateforme :
            </p>
            <ul className="list-disc pl-5 text-sm sm:text-base text-stone-600 space-y-1.5">
              <li><strong className="text-stone-900">Données d&apos;identification :</strong> Nom complet, adresse email, numéro de téléphone.</li>
              <li><strong className="text-stone-900">Informations de profil :</strong> Rôle (Locataire, Propriétaire ou Agence) et nom d&apos;agence (le cas échéant).</li>
              <li><strong className="text-stone-900">Justificatifs de paiement :</strong> Reçus ou preuves de transfert (lors du paiement d&apos;options ou d&apos;abonnements), uniquement en vue de la validation par notre équipe d&apos;administration.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-neutral-900 font-bold font-heading text-lg sm:text-xl border-b pb-2 border-stone-100">
              <ShieldCheck className="h-5 w-5 text-[var(--color-primary-text)]" />
              <h2>2. Finalités de la collecte</h2>
            </div>
            <p className="text-sm sm:text-base text-stone-600">
              Vos données personnelles sont utilisées exclusivement pour :
            </p>
            <ul className="list-disc pl-5 text-sm sm:text-base text-stone-600 space-y-1.5">
              <li>Assurer le fonctionnement optimal de la plateforme (création de compte, authentification, gestion des annonces).</li>
              <li>Permettre la mise en relation directe et sécurisée entre propriétaires/agences et candidats à la location ou à l&apos;achat.</li>
              <li>Vous transmettre les notifications d&apos;activité de votre compte, messages des utilisateurs ou mises à jour de statut d&apos;annonces.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-neutral-900 font-bold font-heading text-lg sm:text-xl border-b pb-2 border-stone-100">
              <EyeOff className="h-5 w-5 text-[var(--color-primary-text)]" />
              <h2>3. Accès aux données & Non-revente</h2>
            </div>
            <p className="text-sm sm:text-base text-stone-600">
              L&apos;accès à vos informations personnelles est strictement restreint à l&apos;équipe autorisée de <strong className="text-stone-900">Ma Maison Niger</strong>.
            </p>
            <p className="text-sm sm:text-base text-stone-600 font-semibold text-stone-900">
              Vos données personnelles ne sont JAMAIS vendues, louées ou cédées à des tiers à des fins commerciales ou publicitaires.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-neutral-900 font-bold font-heading text-lg sm:text-xl border-b pb-2 border-stone-100">
              <Clock className="h-5 w-5 text-[var(--color-primary-text)]" />
              <h2>4. Durée de conservation</h2>
            </div>
            <p className="text-sm sm:text-base text-stone-600">
              Vos données personnelles sont conservées aussi longtemps que votre compte reste actif sur la plateforme.
            </p>
            <p className="text-sm sm:text-base text-stone-600">
              En cas de suppression de compte, vos informations d&apos;identification sont immédiatement supprimées ou anonymisées conformément aux standards de sécurité en vigueur.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-neutral-900 font-bold font-heading text-lg sm:text-xl border-b pb-2 border-stone-100">
              <UserX className="h-5 w-5 text-[var(--color-primary-text)]" />
              <h2>5. Droit et procédure de suppression des données</h2>
            </div>
            <p className="text-sm sm:text-base text-stone-600">
              Conformément à la réglementation sur la protection des données, vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression de vos données personnelles.
            </p>
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900 space-y-2">
              <p className="font-semibold">Comment supprimer votre compte et vos données ?</p>
              <p>
                Vous pouvez exercer ce droit directement et de manière autonome à tout moment via le <strong className="text-amber-950">flux de suppression de compte</strong> disponible dans les paramètres de votre espace membre (« Mon Profil » &gt; « Supprimer mon compte »).
              </p>
              <p>
                Vous pouvez également contacter notre équipe par email à <a href="mailto:mamaisonniger@gmail.com" className="underline font-semibold">mamaisonniger@gmail.com</a> pour toute demande d&apos;assistance.
              </p>
            </div>
          </section>

          {/* Footer Back Link */}
          <div className="pt-6 border-t border-stone-100 flex items-center justify-between text-xs sm:text-sm">
            <Link
              href="/conditions-generales"
              className="font-semibold text-stone-600 hover:text-stone-900 hover:underline"
            >
              ← Conditions Générales (CGU)
            </Link>
            <Link
              href="/"
              className="font-semibold text-[var(--color-primary-text)] hover:underline"
            >
              Retour à l&apos;accueil →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
