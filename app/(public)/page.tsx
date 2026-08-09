import Link from "next/link";
import {
  Search,
  Home,
  Building2,
  MapPin,
  Shield,
  Clock,
  ArrowRight,
  ChevronRight,
  Star,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PropertyGrid } from "@/components/property/property-grid";
import { HeroCarousel } from "@/components/property/hero-carousel";
import { formatHeroProperties } from "@/lib/properties/hero-selection";
import type { Listing } from "@/types";

export const revalidate = 60;

export default async function HomePage() {
  const supabase = await createClient();

  // Execute queries in parallel to minimize TTFB
  const [featuredResult, recentResult] = await Promise.all([
    supabase
      .from("properties")
      .select("id, title, city, district, price, type, transactionType, isFeatured, createdAt, property_images!inner(url)")
      .eq("status", "APPROVED")
      .eq("isFeatured", true)
      .order("createdAt", { ascending: false })
      .limit(6),
    supabase
      .from("properties")
      .select("*, property_images(url), profiles(id, name, agencyName, badgeVerified, avatarUrl, phone, role)")
      .eq("status", "APPROVED")
      .order("createdAt", { ascending: false })
      .limit(6),
  ]);

  const featuredProps = (featuredResult.data ?? []) as any[];
  const listings = (recentResult.data ?? []) as any[];

  // Format hero items with graceful fallback
  const heroItems = formatHeroProperties(featuredProps, listings);

  return (
    <div className="animate-fade-in">
      {/* Dynamic Hero Banner (Selection isFeatured + Repli gracieux) */}
      <HeroCarousel items={heroItems} />

      {/* ================================================================
          FEATURED LISTINGS
          ================================================================ */}
      <section className="bg-neutral-50 py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 sm:text-4xl">
                Annonces récentes
              </h2>
              <p className="mt-1 text-sm text-neutral-600 sm:mt-2 sm:text-lg">
                Découvrez les dernières annonces publiées
              </p>
            </div>
            <Link
              href="/recherche"
              className="hidden items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50 sm:flex"
            >
              Voir tout
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 sm:mt-10">
            <PropertyGrid
              listings={listings}
              emptyMessage="Les premières annonces arrivent bientôt !"
            />
          </div>

          <div className="mt-6 text-center sm:hidden">
            <Link
              href="/recherche"
              className="inline-flex items-center gap-1 rounded-lg px-6 py-3 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50"
            >
              Voir toutes les annonces
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ================================================================
          HOW IT WORKS
          ================================================================ */}
      <section className="py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-neutral-900 sm:text-4xl">
              Comment ça marche ?
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base text-neutral-600 sm:mt-4 sm:text-lg">
              Ma Maison simplifie la recherche et la publication d&apos;annonces
              immobilières au Niger.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:mt-16 sm:grid-cols-3 sm:gap-8">
            {[
              {
                icon: <Search className="h-6 w-6 sm:h-7 sm:w-7" />,
                title: "Recherchez",
                description:
                  "Parcourez les annonces par ville, type de bien, budget et plus encore. C'est gratuit et sans inscription.",
                color: "from-primary-500 to-primary-700",
              },
              {
                icon: <Building2 className="h-6 w-6 sm:h-7 sm:w-7" />,
                title: "Contactez",
                description:
                  "Inscrivez-vous pour contacter directement les propriétaires et ajouter des annonces à vos favoris.",
                color: "from-secondary-500 to-secondary-700",
              },
              {
                icon: <Home className="h-6 w-6 sm:h-7 sm:w-7" />,
                title: "Emménagez",
                description:
                  "Visitez les biens, négociez et trouvez le logement idéal pour vous et votre famille.",
                color: "from-primary-700 to-primary-900",
              },
            ].map((step, index) => (
              <div
                key={step.title}
                className="animate-fade-in-up group relative rounded-2xl bg-white p-6 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-card-hover)] sm:p-8"
                style={{ animationDelay: `${index * 150}ms`, animationFillMode: "backwards" }}
              >
                <div className={`inline-flex rounded-xl bg-gradient-to-br ${step.color} p-3 text-white shadow-sm`}>
                  {step.icon}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-neutral-900 sm:mt-5 sm:text-xl">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600 sm:text-base">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          WHY MA MAISON
          ================================================================ */}
      <section className="bg-neutral-50 py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-neutral-900 sm:text-4xl">
              Pourquoi choisir <span className="text-[var(--color-primary-700)]">Ma Maison</span> ?
            </h2>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-16 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {[
              {
                icon: <Shield className="h-6 w-6" />,
                title: "Annonces vérifiées",
                description: "Tous les propriétaires sont vérifiés pour garantir des annonces fiables et authentiques.",
              },
              {
                icon: <MapPin className="h-6 w-6" />,
                title: "Couverture nationale",
                description: "Des annonces dans toutes les grandes villes du Niger : Niamey, Zinder, Maradi, et plus.",
              },
              {
                icon: <Clock className="h-6 w-6" />,
                title: "Mises à jour en temps réel",
                description: "Recevez des notifications instantanées pour les nouvelles annonces correspondant à vos critères.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="flex items-start gap-4 rounded-2xl bg-white p-5 shadow-[var(--shadow-card)] sm:p-6"
              >
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 sm:h-12 sm:w-12">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 sm:text-base">
                    {feature.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          CTA — FOR OWNERS
          ================================================================ */}
      <section className="py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-secondary-600 to-secondary-800 shadow-xl">
            <div className="relative px-6 py-12 sm:px-16 sm:py-20">
              <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/5 blur-2xl" />
              <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-white/5 blur-2xl" />
              <div className="relative mx-auto max-w-2xl text-center">
                <h2 className="text-2xl font-bold text-white sm:text-4xl">
                  Vous êtes propriétaire ?
                </h2>
                <p className="mt-3 text-base text-white/80 sm:mt-4 sm:text-lg">
                  Publiez vos annonces gratuitement, sans limite de temps.
                  Touchez des milliers de locataires potentiels au Niger.
                </p>
                <div className="mt-6 sm:mt-8">
                  <Link
                    href="/inscription"
                    className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-semibold text-secondary-700 shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] sm:w-auto sm:px-8 sm:text-base"
                  >
                    Commencer gratuitement
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
