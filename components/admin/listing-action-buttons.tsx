"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Eye, EyeOff, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";

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
  const [targetStatus, setTargetStatus] = useState<"APPROVED" | "REJECTED" | "HIDDEN" | null>(null);
  const router = useRouter();

  const currentStatus = String(status).toUpperCase();
  const isPending = currentStatus === "PENDING";
  const isApproved = currentStatus === "APPROVED";

  async function executeModerate() {
    if (!targetStatus) return;
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

      setTargetStatus(null);
      router.refresh();
    } catch (err: any) {
      alert("Erreur : " + err.message);
    } finally {
      setIsLoading(false);
    }
  }

  const titles: Record<string, string> = {
    APPROVED: "Valider et publier l'annonce",
    REJECTED: "Refuser l'annonce",
    HIDDEN: "Masquer l'annonce",
  };

  const descriptions: Record<string, string> = {
    APPROVED: "L'annonce sera immédiatement visible publiquement par tous les visiteurs.",
    REJECTED: "L'annonce sera refusée et renvoyée en statut rejeté.",
    HIDDEN: "L'annonce ne sera plus affichée dans la recherche publique.",
  };

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
        ) : (
          <>
            {/* Moderation buttons for PENDING listings */}
            {isPending && (
              <>
                <button
                  onClick={() => setTargetStatus("APPROVED")}
                  disabled={isLoading}
                  title="Valider l'annonce (APPROVED)"
                  className="flex items-center gap-1 rounded-lg border border-green-800 bg-green-950 px-2.5 py-1 text-xs font-semibold text-green-400 transition-colors hover:bg-green-900"
                >
                  <Check className="h-3.5 w-3.5" />
                  Valider
                </button>
                <button
                  onClick={() => setTargetStatus("REJECTED")}
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
                onClick={() => setTargetStatus(isApproved ? "HIDDEN" : "APPROVED")}
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

      <Modal
        isOpen={targetStatus !== null}
        onClose={() => setTargetStatus(null)}
        title={targetStatus ? titles[targetStatus] : "Confirmer la modération"}
        description={targetStatus ? descriptions[targetStatus] : ""}
        footer={
          <>
            <button
              onClick={() => setTargetStatus(null)}
              className="rounded-xl border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 hover:bg-neutral-800"
            >
              Annuler
            </button>
            <button
              onClick={executeModerate}
              disabled={isLoading}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-md disabled:opacity-50 ${
                targetStatus === "REJECTED" || targetStatus === "HIDDEN"
                  ? "border border-red-800 bg-red-950 text-red-400 hover:bg-red-900"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Confirmer l&apos;action
            </button>
          </>
        }
      >
        <p className="text-sm text-neutral-300">
          Êtes-vous sûr de vouloir effectuer cette action de modération sur cette annonce ?
        </p>
      </Modal>
    </>
  );
}
