"use client";

import { useState } from "react";
import { Share2, Heart, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type DetailActionButtonsProps = {
  propertyId: string;
  propertyTitle: string;
  isFavoriteInitial?: boolean;
  isAuthenticated?: boolean;
};

export function DetailActionButtons({
  propertyId,
  propertyTitle,
  isFavoriteInitial = false,
  isAuthenticated = false,
}: DetailActionButtonsProps) {
  const [isFavorite, setIsFavorite] = useState(isFavoriteInitial);
  const [isToggling, setIsToggling] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const shareUrl = window.location.href;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: propertyTitle,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard if share was canceled or failed
      }
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch {
        // Ignored
      }
    }
  }

  async function handleFavoriteClick() {
    if (!isAuthenticated) {
      window.location.href = `/connexion?redirectTo=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    if (isToggling) return;
    setIsToggling(true);

    const nextState = !isFavorite;
    setIsFavorite(nextState);

    try {
      if (nextState) {
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ propertyId }),
        });
        if (!res.ok) setIsFavorite(!nextState);
      } else {
        const res = await fetch(`/api/favorites?propertyId=${propertyId}`, {
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
    <div className="relative flex items-center gap-2">
      {copied && (
        <div className="absolute top-11 right-0 z-50 flex items-center gap-1.5 rounded-xl bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white shadow-lg animate-fade-in">
          <Check className="h-3.5 w-3.5 text-green-400" />
          <span>Lien copié !</span>
        </div>
      )}

      <button
        type="button"
        onClick={handleShare}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-neutral-500 transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-text)]"
        title="Partager l'annonce"
      >
        <Share2 className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={handleFavoriteClick}
        disabled={isToggling}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-neutral-500 transition-colors hover:bg-red-500/10 hover:text-red-500"
        title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
      >
        <Heart
          className={cn(
            "h-4 w-4 transition-colors",
            isFavorite ? "fill-red-500 text-red-500" : "text-neutral-500"
          )}
        />
      </button>
    </div>
  );
}
