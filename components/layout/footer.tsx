import Link from "next/link";
import { Home, ShieldCheck, Mail, Phone, MapPin } from "lucide-react";
import { Logo } from "@/components/ui/logo";

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-neutral-900 text-neutral-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand Column */}
          <div className="space-y-4">
            <Logo variant="light" />
            <p className="text-xs leading-relaxed text-neutral-400">
              La plateforme immobilière de confiance au Niger. Trouvez votre maison, appartement, villa ou bureau idéal en toute sécurité.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">Navigation</h4>
            <ul className="mt-4 space-y-2 text-xs text-neutral-400">
              <li>
                <Link href="/" className="hover:text-white transition-colors">Accueil</Link>
              </li>
              <li>
                <Link href="/recherche" className="hover:text-white transition-colors">Rechercher un bien</Link>
              </li>
              <li>
                <Link href="/inscription" className="hover:text-white transition-colors">Devenir propriétaire</Link>
              </li>
              <li>
                <Link href="/connexion" className="hover:text-white transition-colors">Espace membre</Link>
              </li>
            </ul>
          </div>

          {/* Villes */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">Villes principales</h4>
            <ul className="mt-4 space-y-2 text-xs text-neutral-400">
              <li>Niamey</li>
              <li>Zinder</li>
              <li>Maradi</li>
              <li>Tahoua</li>
              <li>Agadez</li>
              <li>Diffa</li>
              <li>Tillabéri</li>
              <li>Dosso</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">Contact & Support</h4>
            <ul className="mt-4 space-y-2 text-xs text-neutral-400">
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-secondary-500" />
                Niamey, Niger
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-secondary-500" />
                contact@mamaison.ne
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-secondary-500" />
                +227 90 00 00 00
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-neutral-800 pt-6 text-center text-xs text-neutral-500">
          © {new Date().getFullYear()} Ma Maison Niger. Tous droits réservés.
          Ismael Service Digital
        </div>
      </div>
    </footer>
  );
}
