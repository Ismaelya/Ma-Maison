import type { Metadata } from "next";
import { Search, SlidersHorizontal } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PropertyGrid } from "@/components/property/property-grid";
import { SearchFilters } from "@/components/property/search-filters";
import type { Listing, PropertyType, TransactionType } from "@/types";

export const metadata: Metadata = {
  title: "Rechercher un logement",
  description:
    "Recherchez parmi des centaines d'annonces immobilières au Niger. Filtrez par ville, type de bien, budget et plus.",
};

type SearchParams = Promise<{
  city?: string;
  type?: PropertyType;
  transaction?: TransactionType;
  minPrice?: string;
  maxPrice?: string;
  bedrooms?: string;
  q?: string;
}>;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  // Build query with filters
  let { data: propertiesData } = await supabase
    .from("properties")
    .select("*, property_images(url)")
    .eq("status", "APPROVED")
    .order("created_at", { ascending: false });

  let listings: any[] = propertiesData ?? [];

  if (listings.length === 0) {
    let query = supabase
      .from("listings")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (params.city) query = query.eq("city", params.city);
    if (params.type) query = query.eq("property_type", params.type);
    if (params.minPrice) query = query.gte("price", parseInt(params.minPrice, 10));
    if (params.maxPrice) query = query.lte("price", parseInt(params.maxPrice, 10));
    if (params.q) query = query.ilike("title", `%${params.q}%`);

    const { data } = await query.limit(50);
    listings = data ?? [];
  }
  const hasActiveFilters = Object.values(params).some((v) => v !== undefined && v !== "");

  return (
    <div className="animate-fade-in">
      {/* Page header */}
      <div className="border-b border-[var(--border)] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-neutral-900">
            Rechercher un logement
          </h1>
          <p className="mt-2 text-neutral-600">
            {listings.length > 0
              ? `${listings.length} annonce${listings.length > 1 ? "s" : ""} trouvée${listings.length > 1 ? "s" : ""}`
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
          <div className="flex-1">

            <PropertyGrid
              listings={listings}
              emptyMessage={
                hasActiveFilters
                  ? "Aucun résultat pour ces critères"
                  : "Aucune annonce disponible pour le moment"
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
