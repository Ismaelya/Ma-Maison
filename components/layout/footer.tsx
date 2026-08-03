import Link from "next/link";
import { Home, Mail, Phone, MapPin } from "lucide-react";
import { Logo } from "@/components/ui/logo";

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-neutral-900 text-neutral-300">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        {/* Mobile: stack all columns; tablet/desktop: 2+2 or 4 columns */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 md:grid-cols-4">
          {/* Brand Column — full width on mobile */}
          <div className="col-span-2 space-y-3 sm:col-span-2 md:col-span-1">
            <Logo variant="light" />
            <p className="text-xs leading-relaxed text-neutral-400">
              La plateforme immobilière de confiance au Niger. Trouvez votre maison, terrain, boutique ou bureau idéal en toute sécurité.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white sm:text-sm">Navigation</h4>
            <ul className="mt-3 space-y-2 text-xs text-neutral-400 sm:mt-4">
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
            <h4 className="text-xs font-bold uppercase tracking-wider text-white sm:text-sm">Villes</h4>
            <ul className="mt-3 space-y-2 text-xs text-neutral-400 sm:mt-4">
              <li>Niamey</li>
              <li>Zinder</li>
              <li>Maradi</li>
              <li>Tahoua</li>
              <li>Agadez</li>
              <li>Dosso</li>
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-2 sm:col-span-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white sm:text-sm">Contact</h4>
            <ul className="mt-3 space-y-2 text-xs text-neutral-400 sm:mt-4">
              <li className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-secondary-500 flex-shrink-0" />
                Niamey, Niger
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-secondary-500 flex-shrink-0" />
                <span className="break-all">mamaisonniger@gmail.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-secondary-500 flex-shrink-0" />
                +227 96 70 71 16
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-neutral-800 pt-6 text-center text-xs text-neutral-500">
          © {new Date().getFullYear()} Ma Maison Niger. Tous droits réservés.{" "}
          Ismael Service Digital
        </div>
      </div>
    </footer>
  );
}
