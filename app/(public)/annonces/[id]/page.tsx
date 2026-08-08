import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  MapPin,
  Bed,
  Bath,
  Maximize,
  Calendar,
  ArrowLeft,
  Share2,
  Heart,
  CheckCircle2,
  Lock,
  UserPlus,
  LogIn,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  formatPrice,
  getPropertyTypeLabel,
  getTransactionTypeLabel,
  formatDate,
  formatRelativeTime,
  cn,
  getAvatarUrl,
} from "@/lib/utils";
import { ContactProtection } from "@/components/property/contact-modal";

type ListingDetailParams = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: ListingDetailParams): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("properties")
    .select("title, description, city, price, transactionType")
    .eq("id", id)
    .single();

  if (!data) {
    return { title: "Annonce non trouvée" };
  }

  return {
    title: data.title,
    description:
      data.description ??
      `${data.title} — ${getTransactionTypeLabel(data.transactionType)} à ${data.city} pour ${formatPrice(data.price)}`,
  };
}

export default async function ListingDetailPage({ params }: ListingDetailParams) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: listing } = await supabase
    .from("properties")
    .select("*, profiles(id, name, agencyName, badgeVerified, avatarUrl, phone, createdAt), property_images(url)")
    .eq("id", id)
    .single();

  if (listing) {
    const currentUser = (await supabase.auth.getUser()).data.user;
    const isOwnerVisitor = !!currentUser && currentUser.id === listing.ownerId;
    if (!isOwnerVisitor) {
      const { error } = await supabase.rpc("increment_property_view", { property_id: id });
      if (error) {
        console.error("viewCount RPC failed", error);
      }
    }
  }

  if (!listing) {
    notFound();
  }

  const typedListing = listing as any;
  const owner = typedListing.profiles ?? {};

  // Check if current visitor is authenticated
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();
  const isAuthenticated = !!currentUser;

  // Security Requirement: Exclude exact address for unauthenticated visitors
  if (!isAuthenticated && typedListing && "address" in typedListing) {
    delete typedListing.address;
  }

  const imagesList: string[] =
    Array.isArray(typedListing.images) && typedListing.images.length > 0
      ? typedListing.images
      : Array.isArray(typedListing.property_images)
        ? typedListing.property_images.map((i: any) => i.url)
        : [];

  const roomsCount = typedListing.rooms ?? typedListing.bedrooms ?? null;
  const bathroomsCount = typedListing.bathrooms ?? null;
  const surfaceArea = typedListing.surface ?? typedListing.area_sqm ?? null;
  const locationDesc = typedListing.district ?? typedListing.neighborhood ?? typedListing.city;
  const propType = typedListing.type ?? typedListing.property_type ?? "APARTMENT";
  const transType = typedListing.transaction_type ?? "rent";
  const amenitiesList: string[] = typedListing.amenities ?? [];

  return (
    <div className="animate-fade-in">
      {/* Top bar */}
      <div className="border-b border-[var(--border)] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
          <Link
            href="/recherche"
            className="flex items-center gap-2 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Retour aux résultats</span>
            <span className="sm:hidden">Retour</span>
          </Link>
          <div className="flex items-center gap-2">
            <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-700">
              <Share2 className="h-4 w-4" />
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-neutral-500 transition-colors hover:bg-red-50 hover:text-red-500">
              <Heart className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* On mobile: single column (content then sidebar). On lg: 3-col grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image gallery — Teaser: ONE single image for unauthenticated visitors */}
            <div className="overflow-hidden rounded-2xl bg-neutral-100">
              {imagesList.length > 0 ? (
                <div className={cn("grid grid-cols-1 gap-2", isAuthenticated && imagesList.length > 1 && "sm:grid-cols-2")}>
                  <div className={cn("relative aspect-[4/3]", isAuthenticated && imagesList.length > 1 && "sm:col-span-2")}>
                    <Image
                      src={imagesList[0]!}
                      alt={typedListing.title}
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                  {isAuthenticated &&
                    imagesList.slice(1, 3).map((img: string, i: number) => (
                      <div key={i} className="relative aspect-[4/3]">
                        <Image
                          src={img}
                          alt={`${typedListing.title} - Photo ${i + 2}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                </div>
              ) : (
                <div className="flex aspect-[16/9] items-center justify-center">
                  <Maximize className="h-16 w-16 text-neutral-300" />
                </div>
              )}
            </div>

            {/* Title & badges */}
            <div>
              <div className="flex flex-wrap gap-2">
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold",
                    transType === "rent"
                      ? "bg-primary-100 text-primary-700"
                      : "bg-secondary-100 text-secondary-700"
                  )}
                >
                  {getTransactionTypeLabel(transType)}
                </span>
                <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
                  {getPropertyTypeLabel(propType)}
                </span>
              </div>
              <h1 className="mt-3 text-2xl font-bold text-neutral-900 sm:text-3xl">
                {typedListing.title}
              </h1>
              <p className="mt-2 flex items-center gap-1.5 text-neutral-600">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                {locationDesc !== typedListing.city
                  ? `${locationDesc}, ${typedListing.city}`
                  : typedListing.city}
              </p>
            </div>

            {isAuthenticated ? (
              <>
                {/* Key features */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {roomsCount !== null && (
                    <FeatureBox
                      icon={<Bed className="h-5 w-5" />}
                      label="Pièces"
                      value={String(roomsCount)}
                    />
                  )}
                  {bathroomsCount !== null && (
                    <FeatureBox
                      icon={<Bath className="h-5 w-5" />}
                      label="Salles de bain"
                      value={String(bathroomsCount)}
                    />
                  )}
                  {surfaceArea !== null && (
                    <FeatureBox
                      icon={<Maximize className="h-5 w-5" />}
                      label="Superficie"
                      value={`${surfaceArea} m²`}
                    />
                  )}
                  <FeatureBox
                    icon={<Calendar className="h-5 w-5" />}
                    label="Publié"
                    value={formatRelativeTime(typedListing.createdAt || typedListing.created_at)}
                  />
                </div>

                {/* Description */}
                {typedListing.description && (
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-900">
                      Description
                    </h2>
                    <p className="mt-3 whitespace-pre-line leading-relaxed text-neutral-600">
                      {typedListing.description}
                    </p>
                  </div>
                )}

                {/* Amenities */}
                {amenitiesList.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-900">
                      Équipements & services
                    </h2>
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {amenitiesList.map((amenity: string) => (
                        <div
                          key={amenity}
                          className="flex items-center gap-2 text-sm text-neutral-700"
                        >
                          <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-secondary-500" />
                          {amenity}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* REGISTRATION GATE BANNER FOR UNAUTHENTICATED VISITORS */
              <div className="rounded-3xl border border-primary-200 bg-gradient-to-br from-primary-50/60 via-white to-secondary-50/40 p-6 sm:p-8 shadow-md text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-600/20">
                  <Lock className="h-7 w-7" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 font-heading">
                  Accès réservé aux membres
                </h2>
                <p className="mt-2 text-sm sm:text-base leading-relaxed text-neutral-600 max-w-lg mx-auto font-sans">
                  Connectez-vous ou inscrivez-vous pour voir tous les détails et contacter le propriétaire.
                </p>

                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
                  <Link
                    href={`/connexion?redirectTo=${encodeURIComponent(`/annonces/${id}`)}`}
                    className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-700 hover:shadow-md"
                  >
                    <LogIn className="h-4 w-4" />
                    Se connecter
                  </Link>

                  <Link
                    href={`/inscription?redirectTo=${encodeURIComponent(`/annonces/${id}`)}`}
                    className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-primary-300 bg-white px-6 py-3 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-50"
                  >
                    <UserPlus className="h-4 w-4" />
                    S&apos;inscrire gratuitement
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar — Price & Owner */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 space-y-4">
              {/* Price card */}
              <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
                <p className="text-2xl font-bold text-primary-700 sm:text-3xl">
                  {formatPrice(typedListing.price)}
                </p>
                {transType === "rent" && (
                  <p className="text-neutral-500">par mois</p>
                )}
              </div>

              {/* Owner Card or Gated Owner Card */}
              {isAuthenticated ? (
                <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-card)]">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
                    Propriétaire
                  </h3>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-secondary-600 shadow-sm">
                      <img
                        src={getAvatarUrl(owner.avatarUrl || owner.avatar_url, owner.name)}
                        alt={owner.name || "Propriétaire"}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-neutral-900">
                        {owner.name ?? "Propriétaire"}
                      </h3>
                      <p className="text-xs text-neutral-500">
                        Membre depuis {formatDate(owner.createdAt || owner.created_at)}
                      </p>
                    </div>
                  </div>

                  <ContactProtection
                    phone={owner.phone}
                    ownerName={owner.name ?? "ce propriétaire"}
                    ownerId={owner.id}
                    listingId={typedListing.id}
                    isAuthenticated={isAuthenticated}
                  />
                </div>
              ) : (
                <div className="rounded-2xl border border-[var(--border)] bg-neutral-50 p-6 shadow-[var(--shadow-card)] text-center space-y-4">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-200 text-neutral-500">
                    <Lock className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-900">Informations propriétaire</h3>
                    <p className="text-xs text-neutral-500 mt-1">
                      Connectez-vous ou inscrivez-vous pour contacter le propriétaire et débloquer ses coordonnées.
                    </p>
                  </div>
                  <div className="space-y-2 pt-2">
                    <Link
                      href={`/connexion?redirectTo=${encodeURIComponent(`/annonces/${id}`)}`}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-700"
                    >
                      <LogIn className="h-4 w-4" />
                      Se connecter
                    </Link>
                    <Link
                      href={`/inscription?redirectTo=${encodeURIComponent(`/annonces/${id}`)}`}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-100"
                    >
                      <UserPlus className="h-4 w-4" />
                      S&apos;inscrire
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureBox({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-neutral-50 p-4 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-white text-primary-600 shadow-sm">
        {icon}
      </div>
      <p className="mt-2 text-sm font-semibold text-neutral-900">{value}</p>
      <p className="text-xs text-neutral-500">{label}</p>
    </div>
  );
}
