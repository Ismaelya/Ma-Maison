"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Bed, Bath, Maximize, Heart } from "lucide-react";
import { cn, formatPropertyPrice, getPropertyTypeLabel, getTransactionTypeLabel, formatRelativeTime, getAvatarUrl } from "@/lib/utils";

type PropertyCardProps = {
  listing: any;
  className?: string;
  isFavoriteInitial?: boolean;
};

export function PropertyCard({ listing, className, isFavoriteInitial = false }: PropertyCardProps) {
  const [isFavorite, setIsFavorite] = useState(isFavoriteInitial);
  const [isToggling, setIsToggling] = useState(false);

  // Extract values safely
  const title = listing.title ?? "Annonce immobilière";
  const price = listing.price ?? 0;
  const city = listing.city ?? "";
  const locationText = listing.district ?? listing.neighborhood ?? city;
  const propertyType = listing.type ?? listing.property_type ?? "APARTMENT";
  const rawTrans = listing.transactionType ?? listing.transaction_type ?? "RENT";
  const isRent = String(rawTrans).toUpperCase() === "RENT";
  const rooms = listing.rooms ?? listing.bedrooms ?? null;
  const bathrooms = listing.bathrooms ?? null;
  const surface = listing.surface ?? listing.area_sqm ?? null;
  const furnished = Boolean(listing.furnished);
  const rentalPeriod = listing.rentalPeriod ?? null;

  const ownerProfile = listing.profiles || listing.owner || {};
  const ownerAvatarUrl = getAvatarUrl(ownerProfile.avatarUrl || ownerProfile.avatar_url, ownerProfile.name || ownerProfile.agencyName || ownerProfile.agency_name);
  const ownerDisplayName = (ownerProfile.role?.toUpperCase() === "AGENCY" && (ownerProfile.agencyName || ownerProfile.agency_name))
    ? (ownerProfile.agencyName || ownerProfile.agency_name)
    : (ownerProfile.name || "Annonceur");

  const DEFAULT_PROPERTY_IMAGES: Record<string, string> = {
    VILLA: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
    APARTMENT: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
    HOUSE: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80",
    ROOM: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80",
    OFFICE: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
    SHOP: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80",
    LAND: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
    RESIDENCE: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80",
  };

  // Images resolution
  const rawImageUrl =
    Array.isArray(listing.images) && listing.images.length > 0
      ? (typeof listing.images[0] === 'string' ? listing.images[0] : listing.images[0]?.url)
      : Array.isArray(listing.property_images) && listing.property_images.length > 0
        ? listing.property_images[0].url
        : null;

  const imageUrl = rawImageUrl || DEFAULT_PROPERTY_IMAGES[String(propertyType).toUpperCase()] || DEFAULT_PROPERTY_IMAGES.VILLA;

  async function handleFavoriteClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (isToggling) return;
    setIsToggling(true);

    const nextState = !isFavorite;
    setIsFavorite(nextState);

    try {
      if (nextState) {
        // Add to favorites
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ propertyId: listing.id }),
        });
        if (!res.ok) setIsFavorite(!nextState);
      } else {
        // Remove from favorites
        const res = await fetch(`/api/favorites?propertyId=${listing.id}`, {
          method: "DELETE",
        });
        if (!res.ok) setIsFavorite(!nextState);
      }
    } catch {
      setIsFavorite(!nextState);
    } finally {
      setIsToggling(false);
    }
  }

  return (
    <Link
      href={`/annonces/${listing.id}`}
      className={cn("property-card group block overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-[var(--shadow-card)]", className)}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Maximize className="h-12 w-12 text-neutral-300" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute left-3 top-3 flex gap-2">
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold shadow-sm text-white",
              isRent
                ? "bg-[var(--color-primary)]"
                : "bg-[var(--color-warning)]"
            )}
          >
            {getTransactionTypeLabel(String(rawTrans))}
          </span>
          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-neutral-700 shadow-sm backdrop-blur-sm">
            {getPropertyTypeLabel(propertyType)}
          </span>
          {furnished && (
            <span className="rounded-full bg-[var(--color-secondary)] px-3 py-1 text-xs font-semibold text-white shadow-sm">
              Meublé
            </span>
          )}
        </div>

        {/* Favorite button */}
        <div className="absolute right-3 top-3">
          <button
            type="button"
            onClick={handleFavoriteClick}
            disabled={isToggling}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition-transform hover:scale-110 active:scale-95"
            title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          >
            <Heart
              className={cn(
                "h-4 w-4 transition-colors",
                isFavorite
                  ? "fill-red-500 text-red-500"
                  : "text-neutral-500 hover:text-red-500"
              )}
            />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Price */}
        <p className="text-lg font-bold text-[var(--color-primary)]">
          {formatPropertyPrice(price, rawTrans, rentalPeriod)}
        </p>

        {/* Title */}
        <h3 className="mt-1 line-clamp-1 text-base font-semibold text-neutral-900 group-hover:text-[var(--color-primary)] transition-colors">
          {title}
        </h3>

        {/* Location */}
        <p className="mt-1 flex items-center gap-1 text-sm text-neutral-500">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-[var(--color-primary)]" />
          <span className="line-clamp-1">
            {locationText !== city ? `${locationText}, ${city}` : city}
          </span>
        </p>

        {/* Features */}
        <div className="mt-3 flex items-center gap-4 border-t border-neutral-100 pt-3">
          {rooms !== null && rooms !== undefined && (
            <div className="flex items-center gap-1 text-sm text-neutral-600">
              <Bed className="h-4 w-4 text-neutral-400" />
              <span>{rooms} p.</span>
            </div>
          )}
          {bathrooms !== null && bathrooms !== undefined && (
            <div className="flex items-center gap-1 text-sm text-neutral-600">
              <Bath className="h-4 w-4 text-neutral-400" />
              <span>{bathrooms} sdb.</span>
            </div>
          )}
          {surface !== null && surface !== undefined && (
            <div className="flex items-center gap-1 text-sm text-neutral-600">
              <Maximize className="h-4 w-4 text-neutral-400" />
              <span>{surface} m²</span>
            </div>
          )}
          <div className="ml-auto flex items-center gap-1.5" title={ownerDisplayName}>
            <Image
              src={ownerAvatarUrl}
              alt={ownerDisplayName}
              width={20}
              height={20}
              className="h-5 w-5 rounded-full object-cover border border-neutral-200"
              loading="lazy"
            />
            <span className="text-xs font-medium text-neutral-500 line-clamp-1 max-w-[90px]">
              {ownerDisplayName !== "Annonceur" ? ownerDisplayName : formatRelativeTime(listing.createdAt || listing.created_at)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
