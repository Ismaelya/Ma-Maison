"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserX, UserCheck, Loader2 } from "lucide-react";

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
  const router = useRouter();

  const normalizedStatus = String(currentStatus).toUpperCase();
  const isSuspended = normalizedStatus === "SUSPENDED";

  if (String(userRole).toUpperCase() === "ADMIN") {
    return <span className="text-xs text-neutral-500">Admin Sys</span>;
  }

  async function toggleStatus() {
    const shouldSuspend = !isSuspended;
    const confirmMessage = shouldSuspend
      ? "Êtes-vous sûr de vouloir suspendre cet utilisateur ? Ses annonces seront immédiatement masquées."
      : "Réactiver le compte de cet utilisateur ?";

    if (!confirm(confirmMessage)) return;

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

      router.refresh();
    } catch (err: any) {
      alert("Erreur lors de la modification du statut : " + err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      onClick={toggleStatus}
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
  );
}
