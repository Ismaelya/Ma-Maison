import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PropertyRepository } from "@/lib/properties/property.repository";
import { PropertyGrid } from "@/components/property/property-grid";
import { SearchFilters } from "@/components/property/search-filters";
import type { PropertyType, TransactionType } from "@/types";

export const metadata: Metadata = {
  title: "Rechercher un logement",
  description:
    "Recherchez parmi des centaines d'annonces immobilières au Niger. Filtrez par ville, type de bien, budget et plus.",
};

type SearchParams = Promise<{
  city?: string;
  type?: PropertyType;
  transaction?: TransactionType;
  transactionType?: TransactionType;
  minPrice?: string;
  maxPrice?: string;
  bedrooms?: string;
  rooms?: string;
  bathrooms?: string;
  sortBy?: "createdAt" | "price";
  sortOrder?: "asc" | "desc";
  page?: string;
  q?: string;
}>;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const pageNum = params.page ? parseInt(params.page, 10) : 1;
  const limit = 6;

  const listings = await PropertyRepository.search({
    city: params.city,
    type: params.type,
    transactionType: params.transactionType || params.transaction,
    minPrice: params.minPrice ? parseInt(params.minPrice, 10) : undefined,
    maxPrice: params.maxPrice ? parseInt(params.maxPrice, 10) : undefined,
    rooms: params.rooms || params.bedrooms ? parseInt(params.rooms || params.bedrooms!, 10) : undefined,
    bathrooms: params.bathrooms ? parseInt(params.bathrooms, 10) : undefined,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
    q: params.q,
    page: pageNum,
    limit,
  });

  const hasActiveFilters = Object.values(params).some((v) => v !== undefined && v !== "");

  return (
    <div className="animate-fade-in">
      {/* Page header */}
      <div className="border-b border-[var(--color-border)] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
          <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
            Rechercher un logement
          </h1>
          <p className="mt-1 text-sm text-neutral-600 sm:mt-2">
            {listings.length > 0
              ? `${listings.length} annonce${listings.length > 1 ? "s" : ""} affichée${listings.length > 1 ? "s" : ""} (Page ${pageNum})`
              : "Modifiez vos filtres pour trouver des annonces"}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
          {/* Filters: collapsible on mobile, always visible on lg */}
          <aside className="w-full lg:w-72 lg:flex-shrink-0">
            {/* Mobile collapse toggle */}
            <details className="group lg:!open" open={false}>
              <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl border border-[var(--border)] bg-white px-4 py-3 font-semibold text-neutral-800 shadow-sm lg:hidden">
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                  </svg>
                  Filtres{hasActiveFilters ? " (actifs)" : ""}
                </span>
                <svg className="h-4 w-4 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="mt-3 lg:mt-0">
                <Suspense fallback={null}>
                  <SearchFilters currentFilters={params} />
                </Suspense>
              </div>
            </details>
          </aside>

          {/* Results */}
          <div className="flex-1 space-y-6 sm:space-y-8">
            <PropertyGrid
              listings={listings}
              emptyMessage={
                hasActiveFilters
                  ? "Aucun résultat pour ces critères"
                  : "Aucune annonce disponible pour le moment"
              }
            />

            {/* Pagination Controls */}
            {listings.length > 0 && (
              <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-5 sm:pt-6">
                <Link
                  href={{
                    pathname: "/recherche",
                    query: { ...params, page: Math.max(1, pageNum - 1) },
                  }}
                  className={`rounded-xl border px-3 py-2 text-xs font-semibold sm:px-4 ${
                    pageNum <= 1
                      ? "pointer-events-none opacity-40 border-neutral-200"
                      : "border-neutral-300 hover:bg-neutral-50"
                  }`}
                >
                  ← Précédente
                </Link>

                <span className="text-xs font-medium text-neutral-500">
                  Page {pageNum}
                </span>

                <Link
                  href={{
                    pathname: "/recherche",
                    query: { ...params, page: pageNum + 1 },
                  }}
                  className={`rounded-xl border px-3 py-2 text-xs font-semibold sm:px-4 ${
                    listings.length < limit
                      ? "pointer-events-none opacity-40 border-neutral-200"
                      : "border-neutral-300 hover:bg-neutral-50"
                  }`}
                >
                  Suivante →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
