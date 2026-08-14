"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, MapPin, ArrowRight, ChevronLeft, ChevronRight, Star } from "lucide-react";
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

interface HeroCarouselProps {
  items: HeroFeaturedItem[];
}

export function HeroCarousel({ items }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [items.length]);

  const activeItem = items[currentIndex] || items[0];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  return (
    <section className="relative h-[85vh] min-h-[580px] max-h-[780px] w-full overflow-hidden bg-[var(--color-primary-950)]">
      {/* Background Ken Burns & Cross-Fade Slides */}
      {items.map((item, index) => {
        const isActive = index === currentIndex;
        return (
          <div
            key={item.id + index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.title}
                fill
                priority={index === 0}
                className={`object-cover transition-transform duration-[7000ms] ease-out ${
                  isActive ? "scale-105" : "scale-100"
                }`}
                sizes="100vw"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-[var(--color-primary-950)] via-[var(--color-primary-900)] to-[var(--color-secondary-950)]" />
            )}
            {/* Multi-stage dark gradient overlay for optimal AA text contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-primary-950)] via-[var(--color-primary-950)]/65 to-[var(--color-primary-950)]/30" />
          </div>
        );
      })}

      {/* Hero Content Overlay */}
      <div className="relative z-20 mx-auto flex h-full max-w-7xl flex-col justify-between px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {/* Top Tagline Badge */}
        <div className="pt-6 sm:pt-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-md">
            <span className="text-xs font-semibold uppercase tracking-wider text-white">
              La plateforme immobilière au Niger
            </span>
          </div>
        </div>

        {/* Center Headline & Dynamic Property Card */}
        <div className="my-auto max-w-3xl space-y-6">
          <h1 className="text-3xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl tracking-tight font-heading">
            Trouvez votre logement idéal{" "}
            <span className="text-[var(--color-secondary-400)]">au Niger</span>
          </h1>

          <p className="text-base text-stone-300 sm:text-xl leading-relaxed font-sans max-w-2xl">
            Parcourez des centaines d&apos;annonces immobilières à Niamey et dans tout le Niger. Location, achat, terrains — Ma Maison simplifie votre recherche.
          </p>

          {/* Active Featured Property Preview Pill */}
          {activeItem && (
            <Link
              href={`/annonces/${activeItem.id}`}
              className="group inline-flex items-center gap-4 rounded-2xl border border-white/15 bg-stone-900/80 p-3 pr-5 text-white backdrop-blur-lg transition-all hover:border-[var(--color-secondary-400)] hover:bg-stone-900/95 shadow-xl"
            >
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--color-secondary-500)]/20 text-[var(--color-secondary-400)]">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[var(--color-secondary-400)] uppercase tracking-wider">
                    {activeItem.city} • {activeItem.district}
                  </span>
                  <span className="rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-stone-200">
                    {activeItem.transactionType === "RENT" ? "Location" : "Vente"}
                  </span>
                </div>
                <h2 className="text-sm font-bold text-white line-clamp-1 group-hover:text-[var(--color-secondary-400)] transition-colors">
                  {activeItem.title}
                </h2>
                <div className="text-xs font-extrabold text-white">
                  {formatPrice(activeItem.price)}
                  {activeItem.transactionType === "RENT" && <span className="text-stone-400 font-normal"> /mois</span>}
                </div>
              </div>
              <ArrowRight className="ml-auto h-5 w-5 text-stone-400 transition-transform group-hover:translate-x-1 group-hover:text-[var(--color-secondary-400)]" />
            </Link>
          )}

          {/* CTA Search Button */}
          <div className="pt-2 flex flex-col sm:flex-row gap-4">
            <Link
              href="/recherche"
              className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-brand px-7 py-4 text-base font-bold text-white shadow-lg transition-all hover:brightness-110 hover:scale-[1.02]"
            >
              <Search className="h-5 w-5" />
              Rechercher un logement
            </Link>
            <Link
              href="/inscription"
              className="inline-flex items-center justify-center gap-2.5 rounded-xl border border-white/30 bg-white/10 px-7 py-4 text-base font-bold text-white backdrop-blur-md transition-all hover:bg-white/20"
            >
              Publier une annonce
            </Link>
          </div>
        </div>

        {/* Bottom Carousel Controls & Indicators */}
        <div className="flex items-center justify-between pt-6 border-t border-white/10">
          <div className="flex items-center gap-2">
            {items.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Aller à la diapositive ${idx + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentIndex ? "w-8 bg-[var(--color-secondary-400)]" : "w-2 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>

          {items.length > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                aria-label="Diapositive précédente"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-sm transition-all hover:bg-white/20"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={handleNext}
                aria-label="Diapositive suivante"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-sm transition-all hover:bg-white/20"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
