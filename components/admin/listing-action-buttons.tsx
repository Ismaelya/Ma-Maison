"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Trash2, Star, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type ListingActionButtonsProps = {
  listingId: string;
  isPublished: boolean;
  isFeatured: boolean;
};

export function ListingActionButtons({
  listingId,
  isPublished,
  isFeatured,
}: ListingActionButtonsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function togglePublished() {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("listings")
        .update({ is_published: !isPublished })
        .eq("id", listingId);

      if (error) throw error;
      router.refresh();
    } catch (err: any) {
      alert("Erreur lors de la modération : " + err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function toggleFeatured() {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("listings")
        .update({ is_featured: !isFeatured })
        .eq("id", listingId);

      if (error) throw error;
      router.refresh();
    } catch (err: any) {
      alert("Erreur : " + err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteListing() {
    if (!confirm("Voulez-vous supprimer définitivement cette annonce ?")) return;
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("listings")
        .delete()
        .eq("id", listingId);

      if (error) throw error;
      router.refresh();
    } catch (err: any) {
      alert("Erreur lors de la suppression : " + err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={toggleFeatured}
        disabled={isLoading}
        title={isFeatured ? "Retirer la mise en avant" : "Mettre en avant"}
        className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs transition-colors ${
          isFeatured
            ? "border-yellow-600 bg-yellow-950 text-yellow-400"
            : "border-neutral-800 text-neutral-400 hover:bg-neutral-800"
        }`}
      >
        <Star className="h-4 w-4" />
      </button>

      <button
        onClick={togglePublished}
        disabled={isLoading}
        title={isPublished ? "Masquer l'annonce" : "Publier l'annonce"}
        className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs transition-colors ${
          isPublished
            ? "border-green-800 bg-green-950 text-green-400"
            : "border-neutral-800 text-neutral-400 hover:bg-neutral-800"
        }`}
      >
        {isPublished ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      </button>

      <button
        onClick={deleteListing}
        disabled={isLoading}
        title="Supprimer l'annonce"
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-900 bg-red-950 text-red-400 transition-colors hover:bg-red-900"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
