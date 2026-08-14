import Link from "next/link";
import { Search, Heart, MessageSquare, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { MobileNav } from "./mobile-nav";
import { HeaderSignOut } from "./header-sign-out";
import { cn, getAvatarUrl } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let profile: { role: string; name?: string | null; avatarUrl?: string | null } | null = null;
  if (user) { const { data } = await supabase.from("profiles").select("role, name, avatarUrl").eq("id", user.id).single(); profile = data as any; }
  const isOwner = ["OWNER", "AGENCY"].includes(String(profile?.role || "").toUpperCase());

  return <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl"><div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10"><Logo /><nav className="hidden items-center gap-1 md:flex"><Link href="/recherche" className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-[#13299A]"><Search className="h-4 w-4" /> Explorer</Link>{user ? <><Link href="/dashboard/favoris" className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"><Heart className="h-4 w-4" /> Favoris</Link><Link href="/dashboard/messages" className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"><MessageSquare className="h-4 w-4" /> Messages</Link>{isOwner && <Link href="/dashboard/annonces/nouveau" className="ml-2 flex items-center gap-2 rounded-xl bg-[#13299A] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#13299A]/20 transition hover:bg-[#0c1a64]"><Plus className="h-4 w-4" /> Publier</Link>}<Link href="/dashboard" className="ml-2 rounded-full p-0.5 ring-2 ring-[#60f0d5] transition hover:scale-105"><img src={getAvatarUrl(profile?.avatarUrl, profile?.name)} alt={profile?.name || "Profil"} className="h-9 w-9 rounded-full object-cover" /></Link><HeaderSignOut /></> : <><Link href="/connexion" className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100">Se connecter</Link><Link href="/inscription" className="rounded-xl bg-[#13299A] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#13299A]/20 transition hover:bg-[#0c1a64]">Créer un compte</Link></>}<ThemeToggle /></nav><MobileNav user={user} profile={profile} /></div></header>;
}
