"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvailabilitySelectorProps {
  propertyId: string;
  transactionType: string;
  initialAvailability?: string;
  className?: string;
}

export function AvailabilitySelector({
  propertyId,
  transactionType,
  initialAvailability = "AVAILABLE",
  className,
}: AvailabilitySelectorProps) {
  const [availability, setAvailability] = useState<string>(
    initialAvailability.toUpperCase()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  const isRent = String(transactionType).toUpperCase() === "RENT";

  // Define allowed options based on transaction type
  const options = isRent
    ? [
        { value: "AVAILABLE", label: "Disponible" },
        { value: "UNAVAILABLE", label: "Indisponible" },
      ]
    : [
        { value: "AVAILABLE", label: "Disponible" },
        { value: "SOLD", label: "Vendu" },
      ];

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    const previousValue = availability;

    setAvailability(newValue);
    setIsLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/properties/${propertyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availability: newValue }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error?.message || data.message || "Erreur de mise à jour"
        );
      }

      setStatusMessage({ type: "success", text: "Disponibilité mise à jour" });
      setTimeout(() => setStatusMessage(null), 3000);
      router.refresh();
    } catch (err: any) {
      setAvailability(previousValue);
      setStatusMessage({
        type: "error",
        text: err.message || "Impossible de modifier la disponibilité",
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setIsLoading(false);
    }
  };

  const getBadgeStyle = (val: string) => {
    switch (val) {
      case "UNAVAILABLE":
        return "bg-neutral-100 text-neutral-700 border-neutral-300 hover:bg-neutral-200";
      case "SOLD":
        return "bg-red-50 text-red-700 border-red-200 hover:bg-red-100";
      case "AVAILABLE":
      default:
        return "bg-green-50 text-green-700 border-green-200 hover:bg-green-100";
    }
  };

  return (
    <div className={cn("relative flex items-center gap-2", className)}>
      <div className="relative inline-flex items-center">
        <select
          value={availability}
          onChange={handleChange}
          disabled={isLoading}
          className={cn(
            "appearance-none rounded-xl border px-3 py-1.5 pr-8 text-xs font-semibold cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50",
            getBadgeStyle(availability)
          )}
          title="Modifier la disponibilité"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-white text-neutral-900 font-normal">
              {opt.label}
            </option>
          ))}
        </select>

        {/* Custom Arrow or Loader */}
        <div className="pointer-events-none absolute right-2 flex items-center">
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-500" />
          ) : (
            <svg className="h-3.5 w-3.5 text-current opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </div>

      {statusMessage && (
        <span
          className={cn(
            "flex items-center gap-1 text-xs font-medium animate-fade-in",
            statusMessage.type === "success" ? "text-green-600" : "text-red-600"
          )}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5" />
          )}
          <span>{statusMessage.text}</span>
        </span>
      )}
    </div>
  );
}
