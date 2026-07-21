"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserX, UserCheck, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type UserActionButtonProps = {
  userId: string;
  currentStatus: "active" | "suspended" | "deleted";
  userRole: string;
};

export function UserActionButton({
  userId,
  currentStatus,
  userRole,
}: UserActionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  if (userRole === "admin") {
    return <span className="text-xs text-neutral-500">Admin Sys</span>;
  }

  async function toggleStatus() {
    const nextStatus = currentStatus === "suspended" ? "active" : "suspended";
    const confirmMessage =
      nextStatus === "suspended"
        ? "Êtes-vous sûr de vouloir suspendre cet utilisateur ? Ses annonces seront immédiatement masquées."
        : "Réactiver le compte de cet utilisateur ?";

    if (!confirm(confirmMessage)) return;

    setIsLoading(true);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ account_status: nextStatus } as any)
        .eq("id", userId);

      if (error) throw error;
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
        currentStatus === "suspended"
          ? "bg-green-950 text-green-400 border border-green-800 hover:bg-green-900"
          : "bg-red-950 text-red-400 border border-red-800 hover:bg-red-900"
      }`}
    >
      {isLoading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : currentStatus === "suspended" ? (
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
