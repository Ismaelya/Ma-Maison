import { redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { getUser } from "@/lib/auth/helpers";
import { getTrialDaysRemaining, getAvatarUrl } from "@/lib/utils";
import { DashboardSignOut } from "@/components/dashboard/sign-out-button";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authUser = await getUser();

  if (!authUser) {
    redirect("/connexion");
  }

  const profile = authUser.profile;
  if (!profile) {
    redirect("/connexion");
  }

  const roleStr = String(profile.role || "").toUpperCase();
  const isOwner = roleStr === "OWNER" || roleStr === "AGENCY";
  const rawDate = profile.createdAt || (profile as any).created_at;
  const trialDays = getTrialDaysRemaining(typeof rawDate === "string" ? rawDate : (rawDate ? new Date(rawDate).toISOString() : ""));
  const isExpired = isOwner && (profile as any).subscriptionStatus !== "ACTIVE" && trialDays <= 0;

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] transition-colors">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-bg)]/85 shadow-[0_1px_0_rgba(15,23,42,0.03)] backdrop-blur-lg transition-colors">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-[var(--color-text)]">
                {profile.name || "Utilisateur"}
              </p>
              <p className="text-xs font-medium uppercase tracking-wide text-secondary-600">
                {isOwner ? "Propriétaire" : "Locataire"}
              </p>
            </div>
            <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-brand p-[2px] shadow-sm">
              <img
                src={getAvatarUrl(profile.avatarUrl || (profile as any).avatar_url, profile.name)}
                alt={profile.name || "Profil"}
                className="h-full w-full rounded-full border-2 border-[var(--color-bg)] object-cover"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Trial warning banner */}
      {isOwner && isExpired && (
        <div className="border-b border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 px-4 py-3">
          <div className="mx-auto flex max-w-7xl items-center gap-3 text-sm text-red-700 dark:text-red-300">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <p>
              <strong>Votre période d&apos;essai est terminée.</strong> Vos annonces
              ne sont plus visibles. Souscrivez un abonnement pour continuer.
            </p>
          </div>
        </div>
      )}

      {isOwner && !isExpired && trialDays !== null && trialDays <= 7 && trialDays > 0 && (
        <div className="border-b border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-900 px-4 py-3">
          <div className="mx-auto flex max-w-7xl items-center gap-3 text-sm text-yellow-800 dark:text-yellow-300">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <p>
              <strong>Il vous reste {trialDays} jour{trialDays > 1 ? "s" : ""} d&apos;essai.</strong>{" "}
              Souscrivez un abonnement pour continuer à publier.
            </p>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Sidebar navigation */}
          <aside className="w-full lg:w-60 lg:flex-shrink-0">
            <nav className="space-y-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3 shadow-[var(--shadow-card)] lg:sticky lg:top-24">
              <p className="px-3 pb-1 pt-1 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Menu
              </p>
              <DashboardNav isOwner={isOwner} />

              <div className="my-2 h-px bg-[var(--color-border)]" />

              <DashboardSignOut />
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
