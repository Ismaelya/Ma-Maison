"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef } from "react";
import { Search, X, Calendar, Filter } from "lucide-react";
import { NIGER_CITIES } from "@/lib/validations/listing";
import { getPropertyTypeLabel } from "@/lib/utils";

const PROPERTY_TYPES = [
  "HOUSE",
  "APARTMENT",
  "ROOM",
  "VILLA",
  "OFFICE",
  "SHOP",
  "LAND",
  "RESIDENCE",
];

const PROPERTY_STATUSES = [
  { value: "APPROVED", label: "Approuvée (Publiée)" },
  { value: "PENDING", label: "En attente" },
  { value: "REJECTED", label: "Rejetée" },
  { value: "HIDDEN", label: "Masquée" },
  { value: "DRAFT", label: "Brouillon" },
];

export function AdminListingsFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const currentFilters = {
    q: searchParams.get("q") ?? "",
    status: searchParams.get("status") ?? "",
    city: searchParams.get("city") ?? "",
    type: searchParams.get("type") ?? "",
    startDate: searchParams.get("startDate") ?? "",
    endDate: searchParams.get("endDate") ?? "",
  };

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/admin/annonces?${params.toString()}`);
    },
    [router, searchParams]
  );

  const debouncedUpdateFilter = useCallback(
    (key: string, value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => updateFilter(key, value), 400);
    },
    [updateFilter]
  );

  const clearFilters = useCallback(() => {
    router.push("/admin/annonces");
  }, [router]);

  const hasActiveFilters = Object.values(currentFilters).some((v) => v !== "");

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 sm:p-5 shadow-xl space-y-4 font-sans text-neutral-200">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Filter className="h-4 w-4 text-primary-400" />
          <span>Filtres de recherche</span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Réinitialiser les filtres
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Search text */}
        <div className="lg:col-span-2">
          <label className="mb-1 block text-xs font-medium text-neutral-400">Recherche textuelle</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              placeholder="Titre d'annonce ou nom/email..."
              defaultValue={currentFilters.q}
              onChange={(e) => debouncedUpdateFilter("q", e.target.value)}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 py-2 pl-9 pr-3 text-xs text-white placeholder-neutral-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-400">Statut</label>
          <select
            value={currentFilters.status}
            onChange={(e) => updateFilter("status", e.target.value)}
            className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-primary-500 focus:outline-none"
          >
            <option value="">Tous les statuts</option>
            {PROPERTY_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Property Type Filter */}
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-400">Type de bien</label>
          <select
            value={currentFilters.type}
            onChange={(e) => updateFilter("type", e.target.value)}
            className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-primary-500 focus:outline-none"
          >
            <option value="">Tous les types</option>
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t}>
                {getPropertyTypeLabel(t)}
              </option>
            ))}
          </select>
        </div>

        {/* City Filter */}
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-400">Ville</label>
          <select
            value={currentFilters.city}
            onChange={(e) => updateFilter("city", e.target.value)}
            className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-primary-500 focus:outline-none"
          >
            <option value="">Toutes les villes</option>
            {NIGER_CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Date range filters */}
        <div className="grid grid-cols-2 gap-1.5 lg:col-span-1">
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-400">Du</label>
            <input
              type="date"
              value={currentFilters.startDate}
              onChange={(e) => updateFilter("startDate", e.target.value)}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-2 py-1.5 text-xs text-white focus:border-primary-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-400">Au</label>
            <input
              type="date"
              value={currentFilters.endDate}
              onChange={(e) => updateFilter("endDate", e.target.value)}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-2 py-1.5 text-xs text-white focus:border-primary-500 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
