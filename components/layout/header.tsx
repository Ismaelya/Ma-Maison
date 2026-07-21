import Link from "next/link";
import { Home, Search, User, Menu, X, Heart, MessageSquare, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { MobileNav } from "./mobile-nav";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { role: string; full_name: string | null; avatar_url: string | null; account_status: string; subscription_status: string } | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("role, full_name, avatar_url, account_status, subscription_status")
      .eq("id", user.id)
      .single();
    profile = data as any;
  }

  const isOwner = profile?.role === "owner";

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Logo />

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          <Link
            href="/recherche"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          >
            <Search className="h-4 w-4" />
            Rechercher
          </Link>

          {user ? (
            <>
              {isOwner && (
                <Link
                  href="/dashboard/annonces/nouveau"
                  className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-700 hover:shadow-md"
                >
                  <Plus className="h-4 w-4" />
                  Publier
                </Link>
              )}
              <Link
                href="/dashboard/favoris"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
              >
                <Heart className="h-4 w-4" />
                Favoris
              </Link>
              <Link
                href="/dashboard/messages"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
              >
                <MessageSquare className="h-4 w-4" />
                Messages
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
              >
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white",
                  isOwner ? "bg-secondary-600" : "bg-primary-600"
                )}>
                  {profile?.full_name
                    ? profile.full_name.charAt(0).toUpperCase()
                    : "U"}
                </div>
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/connexion"
                className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100"
              >
                Se connecter
              </Link>
              <Link
                href="/inscription"
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-700 hover:shadow-md"
              >
                S&apos;inscrire
              </Link>
            </>
          )}
        </nav>

        {/* Mobile: Menu trigger */}
        <MobileNav user={user} profile={profile} />
      </div>
    </header>
  );
}
