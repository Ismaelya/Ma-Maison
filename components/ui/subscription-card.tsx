import Link from "next/link";
import { Sparkles, Calendar, CheckCircle2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

type SubscriptionCardProps = {
  status: "free" | "active" | "expired" | string;
  trialStartedAt?: string | null;
  expiresAt?: string | null;
};

export function SubscriptionCard({
  status,
  trialStartedAt,
  expiresAt,
}: SubscriptionCardProps) {
  const isPremium = status.toLowerCase() === "active";
  const isFree = status.toLowerCase() === "free";

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-br from-neutral-900 to-neutral-950 p-6 text-white shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary)] text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-base">Abonnement Propriétaire</h3>
            <p className="text-xs text-neutral-400">
              {isPremium ? "Pass Premium Actif — 1 500 FCFA / mois" : "Offre Essai Gratuit (1 mois)"}
            </p>
          </div>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-bold uppercase border ${
            isPremium
              ? "bg-[var(--color-success)]/20 text-[var(--color-success)] border-[var(--color-success)]/40"
              : isFree
              ? "bg-[var(--color-primary)]/20 text-[var(--color-primary)] border-[var(--color-primary)]/40"
              : "bg-[var(--color-danger)]/20 text-[var(--color-danger)] border-[var(--color-danger)]/40"
          }`}
        >
          {isPremium ? "Premium" : isFree ? "Gratuit" : "Expiré"}
        </span>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-neutral-800 pt-4 text-xs text-neutral-400">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4 text-neutral-500" />
          <span>
            {expiresAt
              ? `Expire le ${formatDate(expiresAt)}`
              : trialStartedAt
              ? `Inscrit le ${formatDate(trialStartedAt)}`
              : "Actif"}
          </span>
        </div>

        {!isPremium && (
          <Link
            href="/dashboard/abonnement"
            className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--color-primary)]/90 transition-colors"
          >
            Passer Premium (1500 FCFA)
          </Link>
        )}
      </div>
    </div>
  );
}
