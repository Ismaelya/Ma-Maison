import Link from "next/link";
import { redirect } from "next/navigation";
import { Home } from "lucide-react";
import { getUser } from "@/lib/auth/helpers";
import { DashboardSignOut } from "@/components/dashboard/sign-out-button";
import { AdminNav } from "@/components/admin/admin-nav";
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

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-50 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Logo
              variant="light"
              badge={
                <span className="text-red-500 text-[11px] uppercase font-mono px-2 py-0.5 rounded bg-red-950 border border-red-800 tracking-wider">
                  Admin
                </span>
              }
            />
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight text-white">
                {profile.name || "Administrateur"}
              </p>
              <p className="text-[11px] font-medium tracking-wide text-neutral-500">ADMINISTRATEUR SYS</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800 text-xs font-bold text-neutral-300 ring-1 ring-neutral-700">
              {(profile.name || "A").charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Admin Sidebar */}
          <aside className="w-full lg:w-56 lg:flex-shrink-0">
            <nav className="space-y-1 rounded-2xl border border-neutral-800 bg-neutral-950 p-3 shadow-xl lg:sticky lg:top-[4.5rem]">
              <p className="px-3 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-600">
                Administration
              </p>
              <AdminNav />

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
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
