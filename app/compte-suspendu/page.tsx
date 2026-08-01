import Link from "next/link";
import { AlertOctagon, Mail, Home } from "lucide-react";
import { Logo } from "@/components/ui/logo";

export default function AccountSuspendedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-md text-center animate-fade-in-up">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-red-600 shadow-sm">
          <AlertOctagon className="h-10 w-10" />
        </div>

        {/* Title & Message */}
        <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
          Compte Suspendu
        </h1>
        <p className="mt-3 text-base text-neutral-600">
          Votre compte a été suspendu par l&apos;administration en raison d&apos;un
          non-respect des conditions d&apos;utilisation ou pour motif de sécurité.
        </p>

        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50/50 p-6 text-left text-sm text-red-800">
          <p className="font-semibold">Conséquences de la suspension :</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-red-700">
            <li>Vos annonces sont désormais masquées au public</li>
            <li>La publication de nouvelles annonces est bloquée</li>
            <li>L&apos;accès à vos fonctionnalités de tableau de bord est restreint</li>
          </ul>
        </div>

        {/* Contact Support */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href="mailto:support@mamaison.ne"
            className="flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-700 hover:shadow-md"
          >
            <Mail className="h-4 w-4" />
            Contacter le support
          </a>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-6 py-3 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-100"
          >
            <Home className="h-4 w-4" />
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
