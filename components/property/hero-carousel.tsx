"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, MapPin, ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export interface HeroFeaturedItem {
  id: string;
  title: string;
  city: string;
  district: string;
  price: number;
  type: string;
  transactionType: string;
  imageUrl: string;
}

interface HeroCarouselProps { items: HeroFeaturedItem[] }

export function HeroCarousel({ items }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => setCurrentIndex((prev) => (prev + 1) % items.length), 6500);
    return () => clearInterval(timer);
  }, [items.length]);

  const activeItem = items[currentIndex] || items[0];
  const move = (delta: number) => setCurrentIndex((prev) => (prev + delta + items.length) % items.length);

  return (
    <section className="relative isolate min-h-[680px] overflow-hidden bg-[#081235] sm:min-h-[760px]">
      {items.map((item, index) => (
        <div key={item.id + index} className={`absolute inset-0 transition-opacity duration-1000 ${index === currentIndex ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0"}`}>
          {item.imageUrl ? <Image src={item.imageUrl} alt={item.title} fill priority={index === 0} className={`object-cover transition-transform duration-[8000ms] ${index === currentIndex ? "scale-105" : "scale-100"}`} sizes="100vw" /> : <div className="h-full w-full bg-[radial-gradient(circle_at_70%_20%,#1e4f9d,transparent_45%),linear-gradient(135deg,#071130,#0d675e)]" />}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,12,45,.96)_0%,rgba(5,12,45,.78)_42%,rgba(5,12,45,.22)_100%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#081235] via-transparent to-[#081235]/20" />
        </div>
      ))}

      <div className="relative z-20 mx-auto flex min-h-[680px] max-w-7xl flex-col justify-center px-5 py-20 sm:min-h-[760px] sm:px-8 lg:px-10">
        <div className="max-w-3xl pt-8">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-bold uppercase tracking-[.16em] text-white/90 backdrop-blur-xl">
            <Sparkles className="h-4 w-4 text-[#61f4d9]" /> La nouvelle façon d’habiter le Niger
          </div>
          <h1 className="max-w-3xl text-4xl font-bold leading-[.98] tracking-[-.045em] text-white sm:text-6xl lg:text-[76px]">
            Un lieu pour vivre.<br /><span className="text-[#60f0d5]">Une histoire à écrire.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-white/72 sm:text-lg">Trouvez un logement qui vous ressemble à Niamey et partout au Niger. Des annonces claires, des propriétaires vérifiés, une recherche qui va droit à l’essentiel.</p>

          <div className="mt-8 max-w-2xl rounded-[24px] border border-white/20 bg-white/95 p-2 shadow-2xl shadow-black/20 backdrop-blur-xl sm:flex sm:items-center sm:gap-2 sm:rounded-2xl">
            <div className="flex flex-1 items-center gap-3 rounded-2xl px-3 py-3 sm:px-4"><Search className="h-5 w-5 text-[#13299A]" /><div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Je recherche</p><p className="text-sm font-semibold text-slate-900">Maison, appartement, terrain…</p></div></div>
            <div className="hidden h-10 w-px bg-slate-200 sm:block" />
            <div className="flex flex-1 items-center gap-3 rounded-2xl px-3 py-3 sm:px-4"><MapPin className="h-5 w-5 text-[#05a98e]" /><div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Où ?</p><p className="text-sm font-semibold text-slate-900">Toutes les villes</p></div></div>
            <Link href="/recherche" className="flex items-center justify-center gap-2 rounded-2xl bg-[#13299A] px-5 py-4 text-sm font-bold text-white transition hover:bg-[#0c1a64] sm:py-3.5">Rechercher <ArrowRight className="h-4 w-4" /></Link>
          </div>

          {activeItem && <Link href={`/annonces/${activeItem.id}`} className="group mt-7 inline-flex max-w-full items-center gap-3 rounded-2xl border border-white/15 bg-black/25 p-2.5 pr-4 text-white backdrop-blur-xl transition hover:bg-black/45"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#60f0d5]/15 text-[#60f0d5]"><MapPin className="h-5 w-5" /></div><div className="min-w-0 text-left"><p className="text-[10px] font-bold uppercase tracking-wider text-[#60f0d5]">À la une · {activeItem.city}</p><p className="truncate text-sm font-bold">{activeItem.title}</p><p className="text-xs text-white/60">{formatPrice(activeItem.price)}{activeItem.transactionType === "RENT" ? " / mois" : ""}</p></div><ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" /></Link>}
        </div>

        <div className="absolute bottom-8 left-5 right-5 flex items-center justify-between sm:left-8 sm:right-8 lg:left-10 lg:right-10"><div className="flex gap-2">{items.map((_, index) => <button key={index} onClick={() => setCurrentIndex(index)} aria-label={`Aller à la diapositive ${index + 1}`} className={`h-1.5 rounded-full transition-all ${index === currentIndex ? "w-10 bg-[#60f0d5]" : "w-2 bg-white/35"}`} />)}</div>{items.length > 1 && <div className="flex gap-2"><button onClick={() => move(-1)} aria-label="Précédente" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur hover:bg-white/20"><ChevronLeft className="h-5 w-5" /></button><button onClick={() => move(1)} aria-label="Suivante" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur hover:bg-white/20"><ChevronRight className="h-5 w-5" /></button></div>}</div>
      </div>
    </section>
  );
}
