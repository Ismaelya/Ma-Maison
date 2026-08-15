import { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, FileText, Scale, UserCheck, AlertTriangle, Gavel } from "lucide-react";

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation (CGU) | Ma Maison Niger",
  description: "Consultez les conditions générales d'utilisation de la plateforme immobilière Ma Maison Niger.",
};

export default function ConditionsGeneralesPage() {
  return (
    <div className="bg-stone-50 min-h-screen py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="rounded-3xl bg-neutral-900 p-8 sm:p-12 text-white shadow-xl mb-10">
          <div className="flex items-center gap-3 text-[var(--color-secondary-400)] mb-3">
            <Scale className="h-6 w-6" />
            <span className="text-xs font-semibold uppercase tracking-wider">Document légal</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold font-heading">
            Conditions Générales d&apos;Utilisation (CGU)
          </h1>
          <p className="mt-3 text-sm sm:text-base text-neutral-300 max-w-2xl font-sans">
            Dernière mise à jour : 15 août 2026. Veuillez lire attentivement les présentes conditions avant d&apos;utiliser notre plateforme.
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8 rounded-3xl bg-white p-6 sm:p-10 border border-stone-200 shadow-sm text-stone-800 font-sans leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-neutral-900 font-bold font-heading text-lg sm:text-xl border-b pb-2 border-stone-100">
              <FileText className="h-5 w-5 text-[var(--color-primary-text)]" />
              <h2>1. Nature du service</h2>
            </div>
            <p className="text-sm sm:text-base text-stone-600">
              <strong className="text-stone-900">Ma Maison Niger</strong> est une plateforme numérique de mise en relation entre propriétaires/agences immobilières et locataires ou acheteurs.
            </p>
            <p className="text-sm sm:text-base text-stone-600">
              Ma Maison Niger intervient exclusivement en tant qu&apos;intermédiaire technique et d&apos;affichage publicitaire d&apos;annonces. <strong className="text-stone-900">Ma Maison Niger n&apos;est en aucun cas partie aux transactions financières, baux, contrats de vente ou accords conclus directement entre utilisateurs.</strong>
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-neutral-900 font-bold font-heading text-lg sm:text-xl border-b pb-2 border-stone-100">
              <UserCheck className="h-5 w-5 text-[var(--color-primary-text)]" />
              <h2>2. Obligations de l&apos;utilisateur</h2>
            </div>
            <p className="text-sm sm:text-base text-stone-600">
              En utilisant Ma Maison Niger, vous vous engagez à :
            </p>
            <ul className="list-disc pl-5 text-sm sm:text-base text-stone-600 space-y-1.5">
              <li>Fournir des informations exactes, sincères et à jour lors de votre inscription et de la publication d&apos;annonces.</li>
              <li>Ne pas publier d&apos;annonces frauduleuses, trompeuses, dupliquées ou portant sur des biens non disponibles.</li>
              <li>Respecter la législation en vigueur au Niger et ne pas porter atteinte aux droits des tiers.</li>
              <li>Maintenir la confidentialité de vos identifiants de connexion.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-neutral-900 font-bold font-heading text-lg sm:text-xl border-b pb-2 border-stone-100">
              <ShieldCheck className="h-5 w-5 text-[var(--color-primary-text)]" />
              <h2>3. Modération et suspension de compte</h2>
            </div>
            <p className="text-sm sm:text-base text-stone-600">
              Ma Maison Niger effectue un contrôle et une vérification des annonces publiées sur la plateforme. Nous nous réservons le droit de :
            </p>
            <ul className="list-disc pl-5 text-sm sm:text-base text-stone-600 space-y-1.5">
              <li>Refuser, modifier ou supprimer toute annonce ne respectant pas les présentes CGU ou la charte de qualité.</li>
              <li>Suspendre ou fermer sans préavis le compte de tout utilisateur en cas de manquement grave, de tentative de fraude ou de publication d&apos;informations mensongères.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-neutral-900 font-bold font-heading text-lg sm:text-xl border-b pb-2 border-stone-100">
              <AlertTriangle className="h-5 w-5 text-[var(--color-primary-text)]" />
              <h2>4. Limitation de responsabilité</h2>
            </div>
            <p className="text-sm sm:text-base text-stone-600">
              Le contenu des annonces publiées relève de la seule responsabilité de leurs auteurs respectifs (propriétaires ou agences). Ma Maison Niger ne saurait être tenue responsable :
            </p>
            <ul className="list-disc pl-5 text-sm sm:text-base text-stone-600 space-y-1.5">
              <li>Des inexactitudes ou omissions dans le contenu des annonces soumises par des tiers.</li>
              <li>Des litiges pouvant survenir entre utilisateurs lors de visites, négociations ou signatures de baux.</li>
              <li>Des dommages directs ou indirects liés à l&apos;utilisation ou à l&apos;impossibilité d&apos;utiliser le service.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-neutral-900 font-bold font-heading text-lg sm:text-xl border-b pb-2 border-stone-100">
              <Gavel className="h-5 w-5 text-[var(--color-primary-text)]" />
              <h2>5. Droit applicable et juridiction compétente</h2>
            </div>
            <p className="text-sm sm:text-base text-stone-600">
              Les présentes Conditions Générales d&apos;Utilisation sont régies et interprétées conformément aux lois de la République du Niger.
            </p>
            <p className="text-sm sm:text-base text-stone-600">
              Tout litige relatif à l&apos;interprétation ou à l&apos;exécution des présentes, non résolu à l&apos;amiable, sera soumis à la compétence exclusive des tribunaux compétents au Niger.
            </p>
          </section>

          {/* Footer Back Link */}
          <div className="pt-6 border-t border-stone-100 flex items-center justify-between text-xs sm:text-sm">
            <Link
              href="/"
              className="font-semibold text-[var(--color-primary-text)] hover:underline"
            >
              ← Retour à l&apos;accueil
            </Link>
            <Link
              href="/confidentialite"
              className="font-semibold text-stone-600 hover:text-stone-900 hover:underline"
            >
              Politique de Confidentialité →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
