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

  const { data: favorites } = await supabase
    .from("favorites")
    .select("id, createdAt, property:properties!inner(*, property_images(*), profiles(*))")
    .eq("userId", profile.id)
    .order("createdAt", { ascending: false });

  return <FavoritesList initialFavorites={favorites ?? []} />;
}
