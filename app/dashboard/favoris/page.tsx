import type { Metadata } from "next";
import Link from "next/link";
import { Heart, Trash2, ExternalLink } from "lucide-react";
import { requireAuth } from "@/lib/auth/helpers";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, getPropertyTypeLabel, cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Mes favoris",
};

export default async function FavoritesPage() {
  const { profile } = await requireAuth();
  const supabase = await createClient();

  const { data: favorites } = await supabase
    .from("favorites")
    .select("id, created_at, listings!inner(id, title, price, city, property_type, transaction_type, images, is_published)")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  const items = favorites ?? [];

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Mes favoris</h1>
        <p className="mt-1 text-neutral-600">
          {items.length} annonce{items.length !== 1 ? "s" : ""} sauvegardée
          {items.length !== 1 ? "s" : ""}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-neutral-200 py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
            <Heart className="h-8 w-8 text-neutral-400" />
          </div>
          <p className="text-lg font-medium text-neutral-900">
            Aucun favori
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            Ajoutez des annonces à vos favoris pour les retrouver facilement
          </p>
          <Link
            href="/recherche"
            className="mt-6 inline-flex rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
          >
            Parcourir les annonces
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {items.map((fav) => {
            const listing = fav.listings as unknown as {
              id: string;
              title: string;
              price: number;
              city: string;
              property_type: string;
              transaction_type: string;
              images: string[];
              is_published: boolean;
            };

            return (
              <Link
                key={fav.id}
                href={`/annonces/${listing.id}`}
                className="group flex gap-4 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-card)] transition-all hover:shadow-[var(--shadow-card-hover)]"
              >
                <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                  {listing.images.length > 0 ? (
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Heart className="h-6 w-6 text-neutral-300" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-neutral-900 group-hover:text-primary-600">
                    {listing.title}
                  </h3>
                  <p className="mt-0.5 text-sm font-medium text-primary-600">
                    {formatPrice(listing.price)}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {listing.city} · {getPropertyTypeLabel(listing.property_type)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
