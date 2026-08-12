"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

/**
 * Client-side hook for managing favorites.
 * Uses TanStack Query for reactive state — this is one of the valid
 * client-side use cases (interactive, user-specific, reactive).
 */
export function useFavorites(userId: string | undefined) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const favoritesQuery = useQuery({
    queryKey: ["favorites", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("favorites")
        .select("propertyId")
        .eq("userId", userId);

      if (error) throw error;
      return (data || []).map((f: any) => f.propertyId);
    },
    enabled: !!userId,
  });

  const addFavorite = useMutation({
    mutationFn: async (listingId: string) => {
      if (!userId) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("favorites")
        .insert({ id: crypto.randomUUID(), userId, propertyId: listingId } as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites", userId] });
    },
  });

  const removeFavorite = useMutation({
    mutationFn: async (listingId: string) => {
      if (!userId) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("userId", userId)
        .eq("propertyId", listingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites", userId] });
    },
  });

  function isFavorite(listingId: string): boolean {
    return favoritesQuery.data?.includes(listingId) ?? false;
  }

  async function toggleFavorite(listingId: string) {
    if (isFavorite(listingId)) {
      await removeFavorite.mutateAsync(listingId);
    } else {
      await addFavorite.mutateAsync(listingId);
    }
  }

  return {
    favorites: favoritesQuery.data ?? [],
    isLoading: favoritesQuery.isLoading,
    isFavorite,
    toggleFavorite,
    isToggling: addFavorite.isPending || removeFavorite.isPending,
  };
}
