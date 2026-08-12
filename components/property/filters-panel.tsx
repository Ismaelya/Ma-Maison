"use client";

import { useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { SearchFilters } from "@/components/property/search-filters";
import { cn } from "@/lib/utils";

type FiltersPanelProps = {
  currentFilters: Record<string, string | undefined>;
  hasActiveFilters: boolean;
};

export function FiltersPanel({ currentFilters, hasActiveFilters }: FiltersPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <aside className="w-full lg:w-72 lg:flex-shrink-0">
      {/* Mobile-only collapse toggle — desktop panel is always visible */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="flex w-full cursor-pointer list-none items-center justify-between rounded-xl border border-[var(--border)] bg-white px-4 py-3 font-semibold text-neutral-800 shadow-sm lg:hidden"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-primary-600" />
          Filtres{hasActiveFilters ? " (actifs)" : ""}
        </span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
      </button>

      <div className={cn("mt-3 lg:mt-0 lg:block", isOpen ? "block" : "hidden")}>
        <SearchFilters currentFilters={currentFilters} />
      </div>
    </aside>
  );
}
