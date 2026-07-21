import { PropertyCard } from "./property-card";
import type { Listing } from "@/types";

type PropertyGridProps = {
  listings: Listing[];
  emptyMessage?: string;
};

export function PropertyGrid({
  listings,
  emptyMessage = "Aucune annonce trouvée",
}: PropertyGridProps) {
  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 py-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
          <svg
            className="h-8 w-8 text-neutral-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>
        <p className="text-lg font-medium text-neutral-900">{emptyMessage}</p>
        <p className="mt-1 text-sm text-neutral-500">
          Revenez plus tard ou modifiez vos filtres.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((listing, index) => (
        <div
          key={listing.id}
          className="animate-fade-in-up"
          style={{ animationDelay: `${index * 80}ms`, animationFillMode: "backwards" }}
        >
          <PropertyCard listing={listing} />
        </div>
      ))}
    </div>
  );
}
