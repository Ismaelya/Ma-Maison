import Link from "next/link";
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
              <li>
                <Link href="/conditions-generales" className="hover:text-white transition-colors">Conditions Générales (CGU)</Link>
              </li>
              <li>
                <Link href="/confidentialite" className="hover:text-white transition-colors">Politique de Confidentialité</Link>
              </li>
            </ul>
          </div>

          {/* Villes */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white sm:text-sm">Villes</h4>
            <ul className="mt-3 space-y-2 text-xs text-neutral-400 sm:mt-4">
              {[
                "Niamey",
                "Agadez",
                "Diffa",
                "Dosso",
                "Maradi",
                "Tahoua",
                "Tillabéri",
                "Zinder",
              ].map((city) => (
                <li key={city}>
                  <Link
                    href={`/recherche?city=${encodeURIComponent(city)}`}
                    className="hover:text-white transition-colors"
                  >
                    {city}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Icons Section */}
          <div className="col-span-2 sm:col-span-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white sm:text-sm">Nous contacter</h4>
            <p className="mt-3 text-xs text-neutral-400">Rejoignez-nous et contactez-nous :</p>
            
            {/* Réseaux Sociaux & Contact (Effet 3D Glossy/Relief) */}
            <div className="mt-4 flex items-center gap-3.5">
              {/* Facebook */}
              <a
                href="https://www.facebook.com/mamaisonniger"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook Ma Maison Niger"
                className="group relative flex h-10 w-10 items-center justify-center rounded-full text-white transition-all duration-200 ease-out hover:-translate-y-1 hover:scale-105 active:translate-y-0 active:scale-95"
                style={{
                  background: "radial-gradient(circle at 35% 25%, #4da3ff 0%, #1877f2 55%, #0c52b5 100%)",
                  boxShadow: "inset 0 1.5px 2px rgba(255, 255, 255, 0.6), inset 0 -2.5px 4px rgba(0, 0, 0, 0.4), 0 4px 10px rgba(24, 119, 242, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3)",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                }}
              >
                <svg
                  className="h-5 w-5 fill-current drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)] transition-transform duration-200 group-hover:scale-110"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>

              {/* WhatsApp */}
              <a
                href="https://wa.me/22796707116"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Contacter Ma Maison Niger sur WhatsApp"
                className="group relative flex h-10 w-10 items-center justify-center rounded-full text-white transition-all duration-200 ease-out hover:-translate-y-1 hover:scale-105 active:translate-y-0 active:scale-95"
                style={{
                  background: "radial-gradient(circle at 35% 25%, #4de882 0%, #25d366 55%, #128c7e 100%)",
                  boxShadow: "inset 0 1.5px 2px rgba(255, 255, 255, 0.6), inset 0 -2.5px 4px rgba(0, 0, 0, 0.4), 0 4px 10px rgba(37, 211, 102, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3)",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                }}
              >
                <svg
                  className="h-5 w-5 fill-current drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)] transition-transform duration-200 group-hover:scale-110"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12.011 2c-5.506 0-9.989 4.478-9.99 9.984 0 1.764.459 3.486 1.332 5.003l-1.416 5.17 5.291-1.387c1.464.798 3.116 1.218 4.78 1.219h.004c5.506 0 9.989-4.478 9.99-9.984 0-2.669-1.038-5.176-2.925-7.062a9.927 9.927 0 0 0-7.062-2.925h-.001zm.003 2c2.133 0 4.137.831 5.646 2.339a7.943 7.943 0 0 1 2.338 5.644c0 4.403-3.582 7.984-7.987 7.984h-.003c-1.478 0-2.924-.407-4.181-1.176l-.3-.183-3.11.815.829-3.028-.201-.32a7.948 7.948 0 0 1-1.215-4.25c0-4.404 3.583-7.985 7.985-7.985h-.003zm-3.376 3.992c-.174 0-.458.065-.698.326-.24.261-.915.894-.915 2.18 0 1.285.937 2.527 1.067 2.701.131.174 1.844 2.815 4.467 3.949.624.27 1.11.431 1.489.551.626.199 1.196.171 1.646.104.502-.075 1.547-.632 1.765-1.242.218-.61.218-1.132.153-1.242-.065-.109-.24-.174-.523-.316-.283-.141-1.678-.828-1.939-.923-.261-.095-.452-.142-.643.142-.191.283-.741.924-.909 1.115-.168.191-.336.213-.619.071-.283-.142-1.195-.44-2.276-1.404-.841-.75-1.408-1.676-1.573-1.959-.165-.283-.018-.436.124-.577.128-.127.283-.331.425-.497.142-.165.189-.283.283-.472.095-.189.047-.355-.024-.497-.071-.142-.643-1.548-.881-2.116-.232-.553-.468-.478-.643-.487-.165-.008-.355-.008-.545-.008z" />
                </svg>
              </a>

              {/* Gmail */}
              <a
                href="mailto:mamaisonniger@gmail.com"
                aria-label="Envoyer un email à Ma Maison Niger"
                className="group relative flex h-10 w-10 items-center justify-center rounded-full text-white transition-all duration-200 ease-out hover:-translate-y-1 hover:scale-105 active:translate-y-0 active:scale-95"
                style={{
                  background: "radial-gradient(circle at 35% 25%, #ff6b5c 0%, #ea4335 55%, #b31412 100%)",
                  boxShadow: "inset 0 1.5px 2px rgba(255, 255, 255, 0.6), inset 0 -2.5px 4px rgba(0, 0, 0, 0.4), 0 4px 10px rgba(234, 67, 53, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3)",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                }}
              >
                <svg
                  className="h-5 w-5 fill-current drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)] transition-transform duration-200 group-hover:scale-110"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-neutral-800 pt-6 text-center text-xs text-neutral-500">
          © {new Date().getFullYear()} Ma Maison Niger. Tous droits réservés.{" "}
          
          By Ismael Service Digital
        </div>
      </div>
    </footer>
  );
}
