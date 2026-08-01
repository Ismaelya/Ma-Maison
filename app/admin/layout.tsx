import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  CreditCard,
  Flag,
  ShieldCheck,
  Home,
} from "lucide-react";
import { getUser } from "@/lib/auth/helpers";
import { DashboardSignOut } from "@/components/dashboard/sign-out-button";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authUser = await getUser();

  if (!authUser) {
    redirect("/connexion");
  }

  const { profile } = authUser;

  // Strict RBAC Guard for Admin section
  if (profile.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const navItems = [
    {
      href: "/admin",
      icon: LayoutDashboard,
      label: "Vue d'ensemble",
    },
    {
      href: "/admin/annonces",
      icon: Building2,
      label: "Validation Annonces",
    },
    {
      href: "/admin/utilisateurs",
      icon: Users,
      label: "Gestion Utilisateurs",
    },
    {
      href: "/admin/paiements",
      icon: CreditCard,
      label: "Paiements",
    },
    {
      href: "/admin/signalements",
      icon: Flag,
      label: "Signalements",
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-50 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Logo
              variant="light"
              badge={
                <span className="text-red-500 text-xs uppercase font-mono px-2 py-0.5 rounded bg-red-950 border border-red-800">
                  Admin
                </span>
              }
            />
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="text-right">
              <p className="text-sm font-semibold text-white">
                {profile.name || "Administrateur"}
              </p>
              <p className="text-xs text-neutral-400">ADMINISTRATEUR SYS</p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Admin Sidebar */}
          <aside className="w-full lg:w-64 lg:flex-shrink-0">
            <nav className="space-y-1 rounded-2xl border border-neutral-800 bg-neutral-950 p-3 shadow-xl">
              {adminNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href as any}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white"
                >
                  <item.icon className="h-4 w-4 text-neutral-400" />
                  {item.label}
                </Link>
              ))}

              <div className="my-2 h-px bg-neutral-800" />

              <Link
                href="/dashboard"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
              >
                <Home className="h-4 w-4" />
                Espace Utilisateur
              </Link>

              <DashboardSignOut />
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
