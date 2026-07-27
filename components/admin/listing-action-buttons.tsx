"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Eye, EyeOff, Loader2 } from "lucide-react";

type ListingActionButtonsProps = {
  listingId: string;
  status?: string;
  isPublished?: boolean;
  isFeatured?: boolean;
};

export function ListingActionButtons({
  listingId,
  status = "PENDING",
}: ListingActionButtonsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const currentStatus = String(status).toUpperCase();
  const isPending = currentStatus === "PENDING";
  const isApproved = currentStatus === "APPROVED";

  async function moderate(targetStatus: "APPROVED" | "REJECTED" | "HIDDEN") {
    let confirmMsg = "Confirmer cette action de modération ?";
    if (targetStatus === "APPROVED") confirmMsg = "Valider et publier cette annonce ?";
    if (targetStatus === "REJECTED") confirmMsg = "Refuser cette annonce ?";
    if (targetStatus === "HIDDEN") confirmMsg = "Masquer cette annonce ?";

    if (!confirm(confirmMsg)) return;

    setIsLoading(true);

    try {
      const res = await fetch(`/api/admin/annonces/${listingId}/moderate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Erreur de modération");
      }

      router.refresh();
    } catch (err: any) {
      alert("Erreur : " + err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
      ) : (
        <>
          {/* Moderation buttons for PENDING listings */}
          {isPending && (
            <>
              <button
                onClick={() => moderate("APPROVED")}
                disabled={isLoading}
                title="Valider l'annonce (APPROVED)"
                className="flex items-center gap-1 rounded-lg border border-green-800 bg-green-950 px-2.5 py-1 text-xs font-semibold text-green-400 transition-colors hover:bg-green-900"
              >
                <Check className="h-3.5 w-3.5" />
                Valider
              </button>
              <button
                onClick={() => moderate("REJECTED")}
                disabled={isLoading}
                title="Refuser l'annonce (REJECTED)"
                className="flex items-center gap-1 rounded-lg border border-red-800 bg-red-950 px-2.5 py-1 text-xs font-semibold text-red-400 transition-colors hover:bg-red-900"
              >
                <X className="h-3.5 w-3.5" />
                Refuser
              </button>
            </>
          )}

          {/* Visibility toggle for non-pending listings */}
          {!isPending && (
            <button
              onClick={() => moderate(isApproved ? "HIDDEN" : "APPROVED")}
              disabled={isLoading}
              title={isApproved ? "Masquer l'annonce" : "Publier l'annonce"}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-semibold transition-colors ${
                isApproved
                  ? "border-green-800 bg-green-950 text-green-400 hover:bg-green-900"
                  : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:bg-neutral-800"
              }`}
            >
              {isApproved ? (
                <>
                  <Eye className="h-3.5 w-3.5" />
                  Publiée (Masquer)
                </>
              ) : (
                <>
                  <EyeOff className="h-3.5 w-3.5" />
                  Masquée (Publier)
                </>
              )}
            </button>
          )}
        </>
      )}
    </div>
  );
}
