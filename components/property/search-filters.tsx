"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Search, X } from "lucide-react";
import { NIGER_CITIES } from "@/lib/validations/listing";
import { cn } from "@/lib/utils";

type SearchFiltersProps = {
  currentFilters: Record<string, string | undefined>;
};

export function SearchFilters({ currentFilters }: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/recherche?${params.toString()}`);
    },
    [router, searchParams]
  );

  const clearFilters = useCallback(() => {
    router.push("/recherche");
  }, [router]);

  const hasFilters = Object.values(currentFilters).some(
    (v) => v !== undefined && v !== ""
  );

  return (
    <div className="space-y-6 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-900">Filtres</h2>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
          >
            <X className="h-3.5 w-3.5" />
            Effacer
          </button>
        )}
      </div>

      {/* Text search */}
      <div>
        <label
          htmlFor="search-query"
          className="mb-1.5 block text-sm font-medium text-neutral-700"
        >
          Mot-clé
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            id="search-query"
            type="text"
            placeholder="Ex: villa, studio..."
            defaultValue={currentFilters.q ?? ""}
            onChange={(e) => {
              const timeout = setTimeout(() => {
                updateFilter("q", e.target.value);
              }, 500);
              return () => clearTimeout(timeout);
            }}
            className="w-full rounded-xl border border-[var(--border)] bg-neutral-50 py-2.5 pl-10 pr-4 text-sm transition-colors focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
      </div>

      {/* City */}
      <div>
        <label
          htmlFor="filter-city"
          className="mb-1.5 block text-sm font-medium text-neutral-700"
        >
          Ville
        </label>
        <select
          id="filter-city"
          value={currentFilters.city ?? ""}
          onChange={(e) => updateFilter("city", e.target.value)}
          className="w-full rounded-xl border border-[var(--border)] bg-neutral-50 px-4 py-2.5 text-sm transition-colors focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        >
          <option value="">Toutes les villes</option>
          {NIGER_CITIES.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>

      {/* Transaction type */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">
          Type de transaction
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: "", label: "Tout" },
            { value: "RENT", label: "Location" },
            { value: "SALE", label: "Vente" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => updateFilter("transaction", option.value)}
              className={cn(
                "rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                (currentFilters.transaction ?? "").toUpperCase() === option.value
                  ? "border-primary-500 bg-primary-50 text-primary-700"
                  : "border-[var(--border)] bg-neutral-50 text-neutral-600 hover:bg-neutral-100"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Property type */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">
          Type de bien
        </label>
        <select
          id="filter-type"
          value={currentFilters.type ?? ""}
          onChange={(e) => updateFilter("type", e.target.value)}
          className="w-full rounded-xl border border-[var(--border)] bg-neutral-50 px-4 py-2.5 text-sm transition-colors focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        >
          <option value="">Tous les types</option>
          <option value="HOUSE">Maison</option>
          <option value="APARTMENT">Appartement</option>
          <option value="ROOM">Chambre / Studio</option>
          <option value="VILLA">Villa</option>
          <option value="OFFICE">Bureau</option>
          <option value="SHOP">Boutique / Local commercial</option>
          <option value="LAND">Terrain</option>
        </select>
      </div>

      {/* Price range */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">
          Budget (FCFA)
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            defaultValue={currentFilters.minPrice ?? ""}
            onChange={(e) => {
              const timeout = setTimeout(() => {
                updateFilter("minPrice", e.target.value);
              }, 500);
              return () => clearTimeout(timeout);
            }}
            className="w-1/2 rounded-xl border border-[var(--border)] bg-neutral-50 px-3 py-2.5 text-sm transition-colors focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
          <input
            type="number"
            placeholder="Max"
            defaultValue={currentFilters.maxPrice ?? ""}
            onChange={(e) => {
              const timeout = setTimeout(() => {
                updateFilter("maxPrice", e.target.value);
              }, 500);
              return () => clearTimeout(timeout);
            }}
            className="w-1/2 rounded-xl border border-[var(--border)] bg-neutral-50 px-3 py-2.5 text-sm transition-colors focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
      </div>

      {/* Bedrooms */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">
          Chambres minimum
        </label>
        <div className="flex gap-1.5">
          {["", "1", "2", "3", "4"].map((val) => (
            <button
              key={val}
              onClick={() => updateFilter("bedrooms", val)}
              className={cn(
                "flex-1 rounded-lg border px-2 py-2 text-sm font-medium transition-all",
                (currentFilters.bedrooms ?? "") === val
                  ? "border-primary-500 bg-primary-50 text-primary-700"
                  : "border-[var(--border)] bg-neutral-50 text-neutral-600 hover:bg-neutral-100"
              )}
            >
              {val || "Tout"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
