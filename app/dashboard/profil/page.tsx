import type { Metadata } from "next";
import { User, Shield, Clock } from "lucide-react";
import { requireAuth } from "@/lib/auth/helpers";
import { ProfileForm } from "@/components/forms/profile-form";
import { formatDate, getTrialDaysRemaining, cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Mon profil",
};

export default async function ProfilePage() {
  const { profile } = await requireAuth();
  const roleStr = String(profile.role ?? "").toUpperCase();
  const isOwner = roleStr === "OWNER" || roleStr === "AGENCY";
  const trialRaw = (profile as any).trial_started_at || profile.trialStartedAt;
  const trialDays = isOwner && trialRaw ? getTrialDaysRemaining(typeof trialRaw === "string" ? trialRaw : (trialRaw as Date).toISOString()) : null;

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Mon profil</h1>
        <p className="mt-1 text-neutral-600">
          Gérez vos informations personnelles
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Profile form */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-card)]">
            <h2 className="text-lg font-semibold text-neutral-900">
              Informations personnelles
            </h2>
            <div className="mt-6">
              <ProfileForm profile={profile} />
            </div>
          </div>
        </div>

        {/* Account info sidebar */}
        <div className="space-y-6">
          {/* Account status */}
          <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-card)]">
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-neutral-500">
              <Shield className="h-4 w-4" />
              Compte
            </h3>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Type</span>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    isOwner
                      ? "bg-secondary-100 text-secondary-700"
                      : "bg-primary-100 text-primary-700"
                  )}
                >
                  {isOwner ? "Propriétaire" : "Locataire"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Statut</span>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    profile.status === "ACTIVE"
                      ? "bg-green-100 text-green-700"
                      : profile.status === "SUSPENDED"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                  )}
                >
                  {profile.status === "ACTIVE"
                    ? "Actif"
                    : profile.status === "SUSPENDED"
                      ? "Suspendu"
                      : "Supprimé"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Membre depuis</span>
                <span className="text-sm font-medium text-neutral-900">
                  {formatDate(profile.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Trial info for owners */}
          {isOwner && trialDays !== null && (
            <div
              className={cn(
                "rounded-2xl border p-6 shadow-[var(--shadow-card)]",
                trialDays > 7
                  ? "border-green-200 bg-green-50"
                  : trialDays > 0
                    ? "border-yellow-200 bg-yellow-50"
                    : "border-red-200 bg-red-50"
              )}
            >
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-neutral-600">
                <Clock className="h-4 w-4" />
                Période d&apos;essai
              </h3>
              <p className="mt-3 text-3xl font-bold text-neutral-900">
                {trialDays > 0 ? `${trialDays} jour${trialDays > 1 ? "s" : ""}` : "Terminée"}
              </p>
              <p className="mt-1 text-sm text-neutral-600">
                {trialDays > 0
                  ? "restant avant expiration"
                  : "Souscrivez un abonnement pour continuer"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
