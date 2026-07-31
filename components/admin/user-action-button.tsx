"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserX, UserCheck, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";

type UserActionButtonProps = {
  userId: string;
  currentStatus: "active" | "suspended" | "deleted" | "ACTIVE" | "SUSPENDED" | "DELETED";
  userRole: string;
};

export function UserActionButton({
  userId,
  currentStatus,
  userRole,
}: UserActionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const router = useRouter();

  const normalizedStatus = String(currentStatus).toUpperCase();
  const isSuspended = normalizedStatus === "SUSPENDED";
  const shouldSuspend = !isSuspended;

  if (String(userRole).toUpperCase() === "ADMIN") {
    return <span className="text-xs text-neutral-500">Admin Sys</span>;
  }

  async function executeToggleStatus() {
    setIsLoading(true);

    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle-suspension`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suspend: shouldSuspend }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Erreur lors du changement de statut");
      }

      setShowConfirmModal(false);
      router.refresh();
    } catch (err: any) {
      alert("Erreur lors de la modification du statut : " + err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setShowConfirmModal(true)}
        disabled={isLoading}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
          isSuspended
            ? "bg-green-950 text-green-400 border border-green-800 hover:bg-green-900"
            : "bg-red-950 text-red-400 border border-red-800 hover:bg-red-900"
        }`}
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : isSuspended ? (
          <>
            <UserCheck className="h-3.5 w-3.5" />
            Réactiver
          </>
        ) : (
          <>
            <UserX className="h-3.5 w-3.5" />
            Suspendre
          </>
        )}
      </button>

      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title={shouldSuspend ? "Confirmer la suspension" : "Confirmer la réactivation"}
        description={
          shouldSuspend
            ? "Les annonces publiées par cet utilisateur seront immédiatement masquées."
            : "L'utilisateur pourra à nouveau se connecter et accéder à ses services."
        }
        footer={
          <>
            <button
              onClick={() => setShowConfirmModal(false)}
              className="rounded-xl border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 hover:bg-neutral-800"
            >
              Annuler
            </button>
            <button
              onClick={executeToggleStatus}
              disabled={isLoading}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-md disabled:opacity-50 ${
                shouldSuspend
                  ? "border border-red-800 bg-red-950 text-red-400 hover:bg-red-900"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : shouldSuspend ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
              {shouldSuspend ? "Confirmer la suspension" : "Confirmer la réactivation"}
            </button>
          </>
        }
      >
        <p className="text-sm text-neutral-300">
          Voulez-vous vraiment {shouldSuspend ? "suspendre" : "réactiver"} le compte de cet utilisateur ?
        </p>
      </Modal>
    </>
  );
}
