import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Heart,
  MessageSquare,
  User,
  Plus,
  LogOut,
  AlertTriangle,
  Home,
  CreditCard,
} from "lucide-react";
import { getUser } from "@/lib/auth/helpers";
import { getTrialDaysRemaining, cn, getAvatarUrl } from "@/lib/utils";
import { DashboardSignOut } from "@/components/dashboard/sign-out-button";
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
  const daysRemaining = getTrialDaysRemaining(profile.created_at || (profile as any).createdAt);
  const isExpired = isOwner && (profile as any).subscriptionStatus !== "ACTIVE" && daysRemaining <= 0;

  const navigation = [
    {
      href: "/dashboard",
      icon: LayoutDashboard,
      label: "Vue d'ensemble",
      show: true,
    },
    {
      href: "/dashboard/annonces",
      icon: Building2,
      label: "Mes biens",
      show: isOwner,
    },
    {
      href: "/dashboard/abonnement",
      icon: CreditCard,
      label: "Abonnement",
      show: isOwner,
    },
    {
      href: "/dashboard/favoris",
      icon: Heart,
      label: "Favoris",
      show: true,
    },
    {
      href: "/dashboard/messages",
      icon: MessageSquare,
      label: "Messages",
      show: true,
    },
    {
      href: "/dashboard/profil",
      icon: User,
      label: "Mon profil",
      show: true,
    },
  ].filter((item) => item.show);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] transition-colors">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-bg)]/85 backdrop-blur-lg transition-colors">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-[var(--color-text)]">
                {profile.name || "Utilisateur"}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {isOwner ? "Propriétaire" : "Locataire"}
              </p>
            </div>
            <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-primary-600 shadow-sm">
              <img
                src={getAvatarUrl(profile.avatarUrl || (profile as any).avatar_url, profile.name)}
                alt={profile.name || "Profil"}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Trial warning banner */}
      {isOwner && isExpired && (
        <div className="border-b border-red-200 bg-red-50 px-4 py-3">
          <div className="mx-auto flex max-w-7xl items-center gap-3 text-sm text-red-700">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <p>
              <strong>Votre période d&apos;essai est terminée.</strong> Vos annonces
              ne sont plus visibles. Souscrivez un abonnement pour continuer.
            </p>
          </div>
        </div>
      )}

      {isOwner && !isExpired && trialDays !== null && trialDays <= 7 && trialDays > 0 && (
        <div className="border-b border-yellow-200 bg-yellow-50 px-4 py-3">
          <div className="mx-auto flex max-w-7xl items-center gap-3 text-sm text-yellow-800">
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
            <nav className="space-y-1 rounded-2xl border border-[var(--border)] bg-white p-3 shadow-[var(--shadow-card)]">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href as any}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}

              <div className="my-2 h-px bg-neutral-200" />

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
