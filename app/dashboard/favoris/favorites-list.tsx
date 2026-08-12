"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { PropertyCard } from "@/components/property/property-card";

type FavoriteItem = {
  id: string;
  createdAt: string;
  property: any;
};

type FavoritesListProps = {
  initialFavorites: FavoriteItem[];
};

export function FavoritesList({ initialFavorites }: FavoritesListProps) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>(initialFavorites);

  const handleRemoveFavorite = (favId: string) => {
    setFavorites((prev) => prev.filter((item) => item.id !== favId));
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Mes favoris</h1>
        <p className="mt-1 text-neutral-600">
          {favorites.length} annonce{favorites.length !== 1 ? "s" : ""} sauvegardée
          {favorites.length !== 1 ? "s" : ""}
        </p>
      </div>

      {favorites.length === 0 ? (
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
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((fav) => {
            const listing = fav.property;
            if (!listing) return null;

            return (
              <PropertyCard
                key={fav.id}
                listing={listing}
                isFavoriteInitial={true}
                onFavoriteToggle={(isFav) => {
                  if (!isFav) {
                    handleRemoveFavorite(fav.id);
                  }
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
