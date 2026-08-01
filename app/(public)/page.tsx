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
import { formatPrice } from "@/lib/utils";
import type { Listing } from "@/types";

export default async function HomePage() {
  const supabase = await createClient();

  // Fetch featured / latest properties
  const { data: featuredListings } = await supabase
    .from("properties")
    .select("*, property_images(url), profiles(id, name, agencyName, badgeVerified, avatarUrl, phone, role)")
    .eq("status", "APPROVED")
    .order("createdAt", { ascending: false })
    .limit(6);

  const listings = (featuredListings ?? []) as any[];

  // --- DYNAMIC STATS (replace hardcoded marketing placeholders) ---
  let homepageStats = [
    { value: "500+", label: "Annonces" },
    { value: "8", label: "Villes" },
    { value: "1000+", label: "Utilisateurs" },
  ];

  try {
    // Exclude obvious test fixtures by title pattern (case-insensitive)
    const { data: activeSubs } = await supabase
      .from("subscriptions")
      .select("userId")
      .in("status", ["ACTIVE", "TRIAL"]);

    const activeUserIds = (activeSubs ?? []).map((s: any) => s.userId).filter(Boolean);

    let propsQuery: any = supabase
      .from("properties")
      .select("id, city", { count: "exact" })
      .eq("status", "APPROVED")
      .eq("profiles.status", "ACTIVE");

    if (activeUserIds.length > 0) propsQuery = propsQuery.in("ownerId", activeUserIds);

    const { data: propData, count: propertiesCount } = await propsQuery;

    const citySet = new Set(((propData ?? []) as any[]).map((p) => p.city).filter(Boolean));
    const citiesCount = citySet.size;
    const MAIN_CITIES_COUNT = 8;

    const { data: profilesData, count: profilesCount } = await supabase
      .from("profiles")
      .select("id", { count: "exact" })
      .eq("status", "ACTIVE");

    const rawProperties = Number(propertiesCount ?? 0);
    const rawCities = Number(citiesCount || MAIN_CITIES_COUNT);
    const rawUsers = Number(profilesCount ?? 0);

    const formatAnnouncements = (n: number) => {
      if (n < 10) return `Nouveau — soyez parmi les premiers`;
      if (n < 500) return `${n}`;
      if (n < 1000) return `500+`;
      return `1000+`;
    };

    const formatUsers = (n: number) => {
      if (n < 50) return `${n}`;
      if (n < 1000) return `${n}`;
      return `1000+`;
    };

    const stats = [
      { value: formatAnnouncements(rawProperties), label: "Annonces" },
      { value: `${rawCities}`, label: "Villes" },
      { value: formatUsers(rawUsers), label: "Utilisateurs" },
    ];

    // override the hardcoded stats for rendering below
    homepageStats = stats;
  } catch (err) {
    // Keep hardcoded marketing defaults on error
    // eslint-disable-next-line no-console
    console.warn("Failed to fetch homepage stats:", err);
  }

  return (
    <div className="animate-fade-in">
      {/* ================================================================
          HERO SECTION
          ================================================================ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-secondary-400/20 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
          <div className="mx-auto max-w-3xl text-center">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-sm">
              <Star className="h-4 w-4 text-yellow-300" />
              <span className="text-sm font-medium text-white/90">
                La plateforme immobilière au Niger
              </span>
            </div>

            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Trouvez votre{" "}
              <span className="relative">
                <span className="relative z-10 text-secondary-300">logement idéal</span>
                <span className="absolute bottom-1 left-0 z-0 h-3 w-full bg-secondary-500/30 sm:bottom-2 sm:h-4" />
              </span>{" "}
              au Niger
            </h1>

            <p className="mt-6 text-lg leading-relaxed text-white/80 sm:text-xl">
              Parcourez des centaines d'annonces immobilières à Niamey et dans
              tout le Niger. Location, achat, terrains — Ma Maison simplifie
              votre recherche.
            </p>

            {/* Search CTA */}
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/recherche"
                className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-semibold text-primary-700 shadow-xl transition-all hover:shadow-2xl hover:scale-[1.02] sm:w-auto"
              >
                <Search className="h-5 w-5" />
                Rechercher un logement
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/inscription"
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-white/30 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10 sm:w-auto"
              >
                Publier une annonce
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8">
              {homepageStats.map((stat: any) => (
                <div key={stat.label} className="text-center">
                  <p className="text-2xl font-bold text-white sm:text-3xl">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-sm text-white/60">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full"
            preserveAspectRatio="none"
          >
            <path
              d="M0 80V40C240 0 480 0 720 40C960 80 1200 80 1440 40V80H0Z"
              className="fill-neutral-50"
            />
          </svg>
        </div>
      </section>

      {/* ================================================================
          HOW IT WORKS
          ================================================================ */}
      <section className="bg-neutral-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-neutral-900 sm:text-4xl">
              Comment ça marche ?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
              Ma Maison simplifie la recherche et la publication d'annonces
              immobilières au Niger.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {[
              {
                icon: <Search className="h-7 w-7" />,
                title: "Recherchez",
                description:
                  "Parcourez les annonces par ville, type de bien, budget et plus encore. C'est gratuit et sans inscription.",
                color: "from-primary-500 to-primary-700",
              },
              {
                icon: <Building2 className="h-7 w-7" />,
                title: "Contactez",
                description:
                  "Inscrivez-vous pour contacter directement les propriétaires et ajouter des annonces à vos favoris.",
                color: "from-secondary-500 to-secondary-700",
              },
              {
                icon: <Home className="h-7 w-7" />,
                title: "Emménagez",
                description:
                  "Visitez les biens, négociez et trouvez le logement idéal pour vous et votre famille.",
                color: "from-primary-700 to-primary-900",
              },
            ].map((step, index) => (
              <div
                key={step.title}
                className="animate-fade-in-up group relative rounded-2xl bg-white p-8 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-card-hover)]"
                style={{ animationDelay: `${index * 150}ms`, animationFillMode: "backwards" }}
              >
                <div className={`inline-flex rounded-xl bg-gradient-to-br ${step.color} p-3 text-white shadow-sm`}>
                  {step.icon}
                </div>
                <h3 className="mt-5 text-xl font-semibold text-neutral-900">
                  {step.title}
                </h3>
                <p className="mt-2 leading-relaxed text-neutral-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          FEATURED LISTINGS
          ================================================================ */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold text-neutral-900 sm:text-4xl">
                Annonces récentes
              </h2>
              <p className="mt-2 text-lg text-neutral-600">
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

          <div className="mt-10">
            <PropertyGrid
              listings={listings}
              emptyMessage="Les premières annonces arrivent bientôt !"
            />
          </div>

          <div className="mt-8 text-center sm:hidden">
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
          WHY MA MAISON
          ================================================================ */}
      <section className="bg-neutral-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-neutral-900 sm:text-4xl">
              Pourquoi choisir Ma Maison ?
            </h2>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                className="flex items-start gap-4 rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]"
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900">
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
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-secondary-600 to-secondary-800 shadow-xl">
            <div className="relative px-8 py-16 sm:px-16 sm:py-20">
              <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/5 blur-2xl" />
              <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-white/5 blur-2xl" />
              <div className="relative mx-auto max-w-2xl text-center">
                <h2 className="text-3xl font-bold text-white sm:text-4xl">
                  Vous êtes propriétaire ?
                </h2>
                <p className="mt-4 text-lg text-white/80">
                  Publiez vos annonces gratuitement pendant 30 jours. Touchez
                  des milliers de locataires potentiels au Niger.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
                  <span className="text-sm font-medium text-white">
                    Puis seulement {formatPrice(1500)}/mois
                  </span>
                </div>
                <div className="mt-8">
                  <Link
                    href="/inscription"
                    className="group inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-semibold text-secondary-700 shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]"
                  >
                    Commencer l&apos;essai gratuit
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
