import Link from "next/link";
import Image from "next/image";
import { MapPin, Bed, Bath, Maximize, Heart } from "lucide-react";
import { cn, formatPrice, getPropertyTypeLabel, getTransactionTypeLabel, formatRelativeTime } from "@/lib/utils";
import type { Property } from "@/types";

type PropertyCardProps = {
  listing: any;
  className?: string;
};

export function PropertyCard({ listing, className }: PropertyCardProps) {
  // Extract values safely supporting both Property (Part 3) and Listing (Part 1/2)
  const title = listing.title ?? "Annonce immobilière";
  const price = listing.price ?? 0;
  const city = listing.city ?? "";
  const locationText = listing.district ?? listing.neighborhood ?? city;
  const propertyType = listing.type ?? listing.property_type ?? "APARTMENT";
  const transactionType = listing.transaction_type ?? "rent";
  const rooms = listing.rooms ?? listing.bedrooms ?? null;
  const bathrooms = listing.bathrooms ?? null;
  const surface = listing.surface ?? listing.area_sqm ?? null;

  // Images resolution
  const imageUrl =
    Array.isArray(listing.images) && listing.images.length > 0
      ? listing.images[0]
      : Array.isArray(listing.property_images) && listing.property_images.length > 0
        ? listing.property_images[0].url
        : null;

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
              "rounded-full px-3 py-1 text-xs font-semibold shadow-sm",
              transactionType === "rent"
                ? "bg-primary-600 text-white"
                : "bg-secondary-600 text-white"
            )}
          >
            {getTransactionTypeLabel(transactionType)}
          </span>
          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-neutral-700 shadow-sm backdrop-blur-sm">
            {getPropertyTypeLabel(propertyType)}
          </span>
        </div>

        {/* Favorite button placeholder */}
        <div className="absolute right-3 top-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-colors group-hover:bg-white">
            <Heart className="h-4 w-4 text-neutral-400 transition-colors group-hover:text-red-500" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Price */}
        <p className="text-lg font-bold text-primary-700">
          {formatPrice(price)}
          {transactionType === "rent" && (
            <span className="text-sm font-normal text-neutral-500"> /mois</span>
          )}
        </p>

        {/* Title */}
        <h3 className="mt-1 line-clamp-1 text-base font-semibold text-neutral-900 group-hover:text-primary-700 transition-colors">
          {title}
        </h3>

        {/* Location */}
        <p className="mt-1 flex items-center gap-1 text-sm text-neutral-500">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
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
          <span className="ml-auto text-xs text-neutral-400">
            {listing.profiles?.role?.toUpperCase() === "AGENCY" && (listing.profiles?.agency_name || listing.profiles?.agencyName)
              ? (listing.profiles?.agency_name || listing.profiles?.agencyName)
              : formatRelativeTime(listing.created_at)}
          </span>
        </div>
      </div>
    </Link>
  );
}
