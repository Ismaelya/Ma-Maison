import Link from "next/link";
import { Search, Home, Building2, MapPin, ShieldCheck, ArrowUpRight, ChevronRight, Compass, BadgeCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PropertyGrid } from "@/components/property/property-grid";
import { HeroCarousel } from "@/components/property/hero-carousel";
import { formatHeroProperties } from "@/lib/properties/hero-selection";

export const revalidate = 60;

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [featuredResult, recentResult, profileResult] = await Promise.all([
    supabase.from("properties").select("id, title, city, district, price, type, transactionType, isFeatured, createdAt, property_images!inner(url)").eq("status", "APPROVED").eq("isFeatured", true).order("createdAt", { ascending: false }).limit(6),
    supabase.from("properties").select("*, property_images(url), profiles(id, name, agencyName, badgeVerified, avatarUrl, phone, role)").eq("status", "APPROVED").order("createdAt", { ascending: false }).limit(6),
    user ? supabase.from("profiles").select("role").eq("id", user.id).single() : Promise.resolve({ data: null }),
  ]);
  const listings = (recentResult.data ?? []) as any[];
  const heroItems = formatHeroProperties((featuredResult.data ?? []) as any[], listings);
  const role = (profileResult.data as { role?: string } | null)?.role;
  const showOwnerCta = !user || role === "OWNER" || role === "AGENCY";

  return <div className="bg-white">
    <HeroCarousel items={heroItems} />

    <section className="relative z-30 -mt-8 px-5 sm:px-8 lg:px-10">
      <div className="mx-auto grid max-w-7xl grid-cols-1 overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-xl shadow-slate-900/10 sm:grid-cols-3">
        {[{ icon: <ShieldCheck />, title: "Annonces fiables", text: "Des profils et biens vérifiés" }, { icon: <Compass />, title: "Partout au Niger", text: "Niamey, Zinder, Maradi…" }, { icon: <BadgeCheck />, title: "Simple et humain", text: "Trouvez sans perdre de temps" }].map((item, i) => <div key={item.title} className={`flex items-center gap-4 px-5 py-5 sm:px-7 ${i > 0 ? "border-t border-slate-100 sm:border-l sm:border-t-0" : ""}`}><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#edf0ff] text-[#13299A]">{item.icon}</div><div><p className="text-sm font-bold text-slate-900">{item.title}</p><p className="mt-0.5 text-xs text-slate-500">{item.text}</p></div></div>)}
      </div>
    </section>

    <section className="px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
      <div className="mx-auto max-w-7xl"><div className="flex items-end justify-between gap-4"><div><p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-[#05a98e]">Sélection Ma Maison</p><h2 className="text-3xl font-bold tracking-[-.04em] text-slate-950 sm:text-5xl">Les dernières<br className="sm:hidden" /> opportunités.</h2><p className="mt-3 max-w-md text-sm leading-6 text-slate-500 sm:text-base">Des espaces qui correspondent à vos projets, votre budget et votre façon de vivre.</p></div><Link href="/recherche" className="hidden items-center gap-2 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-bold text-[#13299A] transition hover:border-[#13299A] sm:flex">Tout voir <ArrowUpRight className="h-4 w-4" /></Link></div><div className="mt-10"><PropertyGrid listings={listings} emptyMessage="Les premières annonces arrivent bientôt !" /></div><Link href="/recherche" className="mt-8 flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3.5 text-sm font-bold text-[#13299A] sm:hidden">Voir toutes les annonces <ChevronRight className="h-4 w-4" /></Link></div>
    </section>

    <section className="bg-[#f6f8fc] px-5 py-20 sm:px-8 sm:py-28 lg:px-10"><div className="mx-auto max-w-7xl"><div className="max-w-xl"><p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-[#05a98e]">Une expérience pensée pour vous</p><h2 className="text-3xl font-bold tracking-[-.04em] text-slate-950 sm:text-5xl">Du premier clic<br />à la nouvelle clé.</h2></div><div className="mt-12 grid gap-4 md:grid-cols-3">{[{n:"01", icon:<Search />, title:"Explorez librement", text:"Affinez par ville, budget et type de bien. La recherche reste simple, même sur mobile."},{n:"02", icon:<Building2 />, title:"Faites le bon choix", text:"Consultez des fiches claires, des photos réelles et les informations essentielles."},{n:"03", icon:<Home />, title:"Passez à l’action", text:"Contactez directement le propriétaire et avancez sereinement vers votre prochain chez-vous."}].map((step) => <div key={step.n} className="group rounded-[26px] border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/5 sm:p-8"><div className="flex items-center justify-between"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf0ff] text-[#13299A]">{step.icon}</div><span className="text-sm font-bold text-slate-300">{step.n}</span></div><h3 className="mt-8 text-xl font-bold text-slate-950">{step.title}</h3><p className="mt-3 text-sm leading-6 text-slate-500">{step.text}</p></div>)}</div></div></section>

    {showOwnerCta && <section className="px-5 py-20 sm:px-8 sm:py-28 lg:px-10"><div className="mx-auto max-w-7xl overflow-hidden rounded-[30px] bg-[#0b1747] px-6 py-12 sm:px-14 sm:py-16"><div className="flex flex-col justify-between gap-10 lg:flex-row lg:items-center"><div className="max-w-xl"><p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-[#60f0d5]">Vous avez un bien ?</p><h2 className="text-3xl font-bold tracking-[-.04em] text-white sm:text-5xl">Faites-lui rencontrer<br />la bonne personne.</h2><p className="mt-4 max-w-md text-sm leading-6 text-white/60 sm:text-base">Publiez votre annonce et soyez visible auprès de milliers de personnes qui cherchent leur prochain logement.</p></div><Link href="/inscription" className="inline-flex items-center justify-center gap-3 rounded-2xl bg-[#60f0d5] px-6 py-4 text-sm font-bold text-[#08243e] transition hover:bg-white">Publier une annonce <ArrowUpRight className="h-4 w-4" /></Link></div></div></section>}
  </div>;
}
