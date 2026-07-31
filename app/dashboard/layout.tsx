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
import { getTrialDaysRemaining, cn } from "@/lib/utils";
import { DashboardSignOut } from "@/components/dashboard/sign-out-button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authUser = await getUser();

  if (!authUser) {
    redirect("/connexion");
  }

  const { profile } = authUser;
  const roleStr = String(profile.role ?? "").toUpperCase();
  const isOwner = roleStr === "OWNER" || roleStr === "AGENCY";
  const trialRaw = (profile as any).trial_started_at || profile.trialStartedAt;
  const trialDays = isOwner && trialRaw ? getTrialDaysRemaining(typeof trialRaw === "string" ? trialRaw : (trialRaw as Date).toISOString()) : null;
  const isExpired = (profile as any).subscription_status === "expired";

  const navItems = [
    {
      href: "/dashboard",
      icon: LayoutDashboard,
      label: "Tableau de bord",
      show: true,
    },
    {
      href: "/dashboard/annonces",
      icon: Building2,
      label: "Mes annonces",
      show: isOwner,
    },
    {
      href: "/dashboard/annonces/nouveau",
      icon: Plus,
      label: "Nouvelle annonce",
      show: isOwner && !isExpired,
    },
    {
      href: "/dashboard/abonnement",
      icon: CreditCard,
      label: "Mon abonnement",
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
    <div className="min-h-screen bg-neutral-50">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-sm">
              <Home className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-neutral-900">
              Ma <span className="text-primary-600">Maison</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-neutral-900">
                {profile.name || (profile as any).full_name || "Utilisateur"}
              </p>
              <p className="text-xs text-neutral-500">
                {isOwner ? "Propriétaire" : "Locataire"}
              </p>
            </div>
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white",
                isOwner ? "bg-secondary-600" : "bg-primary-600"
              )}
            >
              {profile.name
                ? profile.name.charAt(0).toUpperCase()
                : (profile as any).full_name
                  ? (profile as any).full_name.charAt(0).toUpperCase()
                  : "U"}
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
