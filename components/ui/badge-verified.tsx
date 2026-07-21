import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type BadgeVerifiedProps = {
  isVerified?: boolean;
  role?: string;
  className?: string;
};

export function BadgeVerified({ isVerified = true, role = "OWNER", className }: BadgeVerifiedProps) {
  if (!isVerified) return null;

  const isAgency = role.toUpperCase() === "AGENCY";
  const label = isAgency ? "Agence Vérifiée" : "Propriétaire Vérifié";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border",
        isAgency
          ? "bg-purple-50 text-purple-700 border-purple-200"
          : "bg-blue-50 text-blue-700 border-blue-200",
        className
      )}
    >
      <ShieldCheck className={cn("h-3.5 w-3.5", isAgency ? "text-purple-600" : "text-blue-600")} />
      {label}
    </span>
  );
}
