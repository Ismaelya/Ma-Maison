import { ReactNode } from "react";
import { ShieldCheck, Clock, CheckCircle2, XCircle, AlertTriangle, Sparkles, EyeOff, FileEdit } from "lucide-react";
import { PropertyStatus, SubscriptionStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "verified"
  | "agency"
  | "pending"
  | "approved"
  | "rejected"
  | "expired"
  | "new"
  | "draft"
  | "hidden"
  | "custom";

export interface BadgeProps {
  variant?: BadgeVariant;
  children?: ReactNode;
  className?: string;
  isVerified?: boolean;
  role?: string;
  propertyStatus?: PropertyStatus | string;
  subscriptionStatus?: SubscriptionStatus | string;
  createdAt?: string | Date;
}

/**
 * Badge Component — Master Prompt Partie 8 Exact Enum Mapping.
 */
export function Badge({
  variant,
  children,
  className,
  isVerified,
  role,
  propertyStatus,
  subscriptionStatus,
  createdAt,
}: BadgeProps) {
  // Client-side "Nouveau" check (< 7 days old)
  const isNew = createdAt
    ? new Date().getTime() - new Date(createdAt).getTime() < 7 * 24 * 60 * 60 * 1000
    : false;

  // Resolve active variant from properties if not explicitly passed
  let activeVariant: BadgeVariant = variant || "custom";

  if (!variant) {
    if (isVerified) {
      activeVariant = role?.toUpperCase() === "AGENCY" ? "agency" : "verified";
    } else if (propertyStatus === "PENDING" || propertyStatus === "pending") {
      activeVariant = "pending";
    } else if (propertyStatus === "APPROVED" || propertyStatus === "approved") {
      activeVariant = "approved";
    } else if (propertyStatus === "REJECTED" || propertyStatus === "rejected") {
      activeVariant = "rejected";
    } else if (propertyStatus === "HIDDEN" || propertyStatus === "hidden") {
      activeVariant = "hidden";
    } else if (propertyStatus === "DRAFT" || propertyStatus === "draft") {
      activeVariant = "draft";
    } else if (subscriptionStatus === "EXPIRED" || subscriptionStatus === "expired") {
      activeVariant = "expired";
    } else if (isNew) {
      activeVariant = "new";
    }
  }

  const styles: Record<BadgeVariant, { bg: string; icon: ReactNode; defaultLabel: string }> = {
    verified: {
      bg: "bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-[var(--color-primary)]/30",
      icon: <ShieldCheck className="h-3.5 w-3.5 text-[var(--color-primary)]" />,
      defaultLabel: "Propriétaire Vérifié",
    },
    agency: {
      bg: "bg-purple-50 text-purple-700 border-purple-200",
      icon: <ShieldCheck className="h-3.5 w-3.5 text-purple-600" />,
      defaultLabel: "Agence Vérifiée",
    },
    pending: {
      bg: "bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/30",
      icon: <Clock className="h-3.5 w-3.5 text-[var(--color-warning)]" />,
      defaultLabel: "En attente",
    },
    approved: {
      bg: "bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/30",
      icon: <CheckCircle2 className="h-3.5 w-3.5 text-[var(--color-success)]" />,
      defaultLabel: "Validé",
    },
    rejected: {
      bg: "bg-[var(--color-danger)]/10 text-[var(--color-danger)] border-[var(--color-danger)]/30",
      icon: <XCircle className="h-3.5 w-3.5 text-[var(--color-danger)]" />,
      defaultLabel: "Refusé",
    },
    expired: {
      bg: "bg-[var(--color-danger)]/10 text-[var(--color-danger)] border-[var(--color-danger)]/30",
      icon: <AlertTriangle className="h-3.5 w-3.5 text-[var(--color-danger)]" />,
      defaultLabel: "Expiré",
    },
    new: {
      bg: "bg-[var(--color-primary)] text-white border-[var(--color-primary)]",
      icon: <Sparkles className="h-3.5 w-3.5 text-white" />,
      defaultLabel: "Nouveau",
    },
    draft: {
      bg: "bg-[var(--color-muted)] text-neutral-600 border-[var(--color-border)]",
      icon: <FileEdit className="h-3.5 w-3.5 text-neutral-500" />,
      defaultLabel: "Brouillon",
    },
    hidden: {
      bg: "bg-neutral-100 text-neutral-500 border-neutral-200",
      icon: <EyeOff className="h-3.5 w-3.5 text-neutral-400" />,
      defaultLabel: "Masqué",
    },
    custom: {
      bg: "bg-[var(--color-muted)] text-[var(--color-text)] border-[var(--color-border)]",
      icon: null,
      defaultLabel: "",
    },
  };

  const current = styles[activeVariant] ?? styles.custom;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold shadow-xs select-none",
        current.bg,
        className
      )}
    >
      {current.icon}
      <span>{children || current.defaultLabel}</span>
    </span>
  );
}
