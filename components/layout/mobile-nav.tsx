"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  Home,
  Search,
  Heart,
  MessageSquare,
  Plus,
  User as UserIcon,
  LogIn,
  UserPlus,
  LayoutDashboard,
  LogOut,
  Building2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";

type MobileNavProps = {
  user: User | null;
  profile: {
    role: string;
    full_name: string | null;
    account_status: string;
    subscription_status: string;
  } | null;
};

export function MobileNav({ user, profile }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const isOwner = profile?.role === "owner";

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setIsOpen(false);
    router.refresh();
    router.push("/");
  }

  return (
    <div className="md:hidden">
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-neutral-700 transition-colors hover:bg-neutral-100"
        aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 top-16 z-40 bg-black/20 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-out panel */}
      <div
        className={cn(
          "fixed right-0 top-16 z-50 h-[calc(100vh-4rem)] w-72 transform bg-white shadow-xl transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex flex-col gap-1 p-4">
          {user && profile && (
            <div className="mb-4 rounded-xl bg-neutral-50 p-4">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white",
                    isOwner ? "bg-secondary-600" : "bg-primary-600"
                  )}
                >
                  {profile.full_name
                    ? profile.full_name.charAt(0).toUpperCase()
                    : "U"}
                </div>
                <div>
                  <p className="font-semibold text-neutral-900">
                    {profile.full_name ?? "Utilisateur"}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {isOwner ? "Propriétaire" : "Locataire"}
                  </p>
                </div>
              </div>
            </div>
          )}

          <NavLink
            href="/"
            icon={<Home className="h-4 w-4" />}
            onClick={() => setIsOpen(false)}
          >
            Accueil
          </NavLink>

          <NavLink
            href="/recherche"
            icon={<Search className="h-4 w-4" />}
            onClick={() => setIsOpen(false)}
          >
            Rechercher
          </NavLink>

          {user ? (
            <>
              <div className="my-2 h-px bg-neutral-200" />

              {isOwner && (
                <NavLink
                  href="/dashboard/annonces/nouveau"
                  icon={<Plus className="h-4 w-4" />}
                  onClick={() => setIsOpen(false)}
                  highlight
                >
                  Publier une annonce
                </NavLink>
              )}

              <NavLink
                href="/dashboard"
                icon={<LayoutDashboard className="h-4 w-4" />}
                onClick={() => setIsOpen(false)}
              >
                Tableau de bord
              </NavLink>

              {isOwner && (
                <NavLink
                  href="/dashboard/annonces"
                  icon={<Building2 className="h-4 w-4" />}
                  onClick={() => setIsOpen(false)}
                >
                  Mes annonces
                </NavLink>
              )}

              <NavLink
                href="/dashboard/favoris"
                icon={<Heart className="h-4 w-4" />}
                onClick={() => setIsOpen(false)}
              >
                Favoris
              </NavLink>

              <NavLink
                href="/dashboard/messages"
                icon={<MessageSquare className="h-4 w-4" />}
                onClick={() => setIsOpen(false)}
              >
                Messages
              </NavLink>

              <NavLink
                href="/dashboard/profil"
                icon={<UserIcon className="h-4 w-4" />}
                onClick={() => setIsOpen(false)}
              >
                Mon profil
              </NavLink>

              <div className="my-2 h-px bg-neutral-200" />

              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Se déconnecter
              </button>
            </>
          ) : (
            <>
              <div className="my-2 h-px bg-neutral-200" />

              <NavLink
                href="/connexion"
                icon={<LogIn className="h-4 w-4" />}
                onClick={() => setIsOpen(false)}
              >
                Se connecter
              </NavLink>

              <NavLink
                href="/inscription"
                icon={<UserPlus className="h-4 w-4" />}
                onClick={() => setIsOpen(false)}
                highlight
              >
                S&apos;inscrire
              </NavLink>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function NavLink({
  href,
  icon,
  children,
  onClick,
  highlight = false,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href as any}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        highlight
          ? "bg-primary-600 text-white hover:bg-primary-700"
          : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
      )}
    >
      {icon}
      {children}
    </Link>
  );
}
