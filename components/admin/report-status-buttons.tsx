"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

type ReportStatusButtonsProps = {
  reportId: string;
  currentStatus: string;
};

export function ReportStatusButtons({ reportId, currentStatus }: ReportStatusButtonsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const statusStr = String(currentStatus).toUpperCase();

  async function updateStatus(nextStatus: "OPEN" | "IN_REVIEW" | "CLOSED") {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/signalements/${reportId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Erreur de mise à jour");
      }

      router.refresh();
    } catch (err: any) {
      alert("Erreur : " + err.message);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />;
  }

  return (
    <div className="flex items-center gap-1.5 justify-end">
      {statusStr !== "IN_REVIEW" && statusStr !== "CLOSED" && (
        <button
          onClick={() => updateStatus("IN_REVIEW")}
          className="rounded-lg border border-yellow-800 bg-yellow-950 px-2.5 py-1 text-xs font-semibold text-yellow-400 hover:bg-yellow-900"
        >
          En cours
        </button>
      )}
      {statusStr !== "CLOSED" && (
        <button
          onClick={() => updateStatus("CLOSED")}
          className="rounded-lg border border-green-800 bg-green-950 px-2.5 py-1 text-xs font-semibold text-green-400 hover:bg-green-900"
        >
          Clôturer
        </button>
      )}
      {statusStr === "CLOSED" && (
        <button
          onClick={() => updateStatus("OPEN")}
          className="rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-xs font-semibold text-neutral-400 hover:bg-neutral-800"
        >
          Rouvrir
        </button>
      )}
    </div>
  );
}
