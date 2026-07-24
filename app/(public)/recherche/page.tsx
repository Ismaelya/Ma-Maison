import type { Metadata } from "next";
import Link from "next/link";
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

  // Query using PropertyRepository.search() with true SQL pagination (.range())
  const listings = await PropertyRepository.search({
    city: params.city,
    type: params.type,
    transactionType: params.transactionType || params.transaction,
    minPrice: params.minPrice ? parseInt(params.minPrice, 10) : undefined,
    maxPrice: params.maxPrice ? parseInt(params.maxPrice, 10) : undefined,
    rooms: params.rooms || params.bedrooms ? parseInt(params.rooms || params.bedrooms!, 10) : undefined,
    page: pageNum,
    limit,
  });

  const hasActiveFilters = Object.values(params).some((v) => v !== undefined && v !== "");

  return (
    <div className="animate-fade-in">
      {/* Page header */}
      <div className="border-b border-[var(--color-border)] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-neutral-900">
            Rechercher un logement
          </h1>
          <p className="mt-2 text-neutral-600">
            {listings.length > 0
              ? `${listings.length} annonce${listings.length > 1 ? "s" : ""} affichée${listings.length > 1 ? "s" : ""} (Page ${pageNum})`
              : "Modifiez vos filtres pour trouver des annonces"}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Filters sidebar */}
          <aside className="w-full lg:w-72 lg:flex-shrink-0">
            <SearchFilters currentFilters={params} />
          </aside>

          {/* Results */}
          <div className="flex-1 space-y-8">
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
              <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-6">
                <Link
                  href={{
                    pathname: "/recherche",
                    query: { ...params, page: Math.max(1, pageNum - 1) },
                  }}
                  className={`rounded-xl border px-4 py-2 text-xs font-semibold ${
                    pageNum <= 1
                      ? "pointer-events-none opacity-40 border-neutral-200"
                      : "border-neutral-300 hover:bg-neutral-50"
                  }`}
                >
                  ← Page précédente
                </Link>

                <span className="text-xs font-medium text-neutral-500">
                  Page {pageNum}
                </span>

                <Link
                  href={{
                    pathname: "/recherche",
                    query: { ...params, page: pageNum + 1 },
                  }}
                  className={`rounded-xl border px-4 py-2 text-xs font-semibold ${
                    listings.length < limit
                      ? "pointer-events-none opacity-40 border-neutral-200"
                      : "border-neutral-300 hover:bg-neutral-50"
                  }`}
                >
                  Page suivante →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
