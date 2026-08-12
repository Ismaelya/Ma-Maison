import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth/helpers";
import { createClient } from "@/lib/supabase/server";
import { FavoritesList } from "./favorites-list";

export const metadata: Metadata = {
  title: "Mes favoris",
};

export default async function FavoritesPage() {
  const { profile } = await requireAuth();
  const supabase = await createClient();

  const { data: favorites, error } = await supabase
    .from("favorites")
    .select("id, createdAt, property:properties(*, property_images(url), profiles(id, name, agencyName, badgeVerified, avatarUrl, phone, role))")
    .eq("userId", profile.id)
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("[FavoritesPage] Erreur Supabase:", error);
  }

  return <FavoritesList initialFavorites={favorites ?? []} />;
}
