import type { Metadata } from "next";
import Link from "next/link";
import { Building2, ExternalLink, MapPin } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { formatPrice, getPropertyTypeLabel, formatDate, cn } from "@/lib/utils";
import { ListingActionButtons } from "@/components/admin/listing-action-buttons";
import type { Listing } from "@/types";

export const metadata: Metadata = {
  title: "Modération des annonces — Admin",
};

export default async function AdminListingsPage() {
  const supabase = await createAdminClient();

  let { data: listingsData, error } = await supabase
    .from("properties")
    .select("*, profiles!inner(id, name, full_name, email)")
    .order("created_at", { ascending: false });

  if (!listingsData || listingsData.length === 0) {
    const { data: legacyData } = await supabase
      .from("listings")
      .select("*, profiles!inner(id, name, full_name, email)")
      .order("created_at", { ascending: false });
    listingsData = legacyData as any;
  }

  const listings = (listingsData ?? []) as any[];

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Modération des annonces</h1>
        <p className="mt-1 text-sm text-neutral-400">
          {listings.length} annonce{listings.length > 1 ? "s" : ""} au total
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-800 bg-red-950/50 p-4 text-sm text-red-300">
          Erreur lors du chargement des annonces.
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-300">
            <thead className="bg-neutral-900 text-xs uppercase text-neutral-400">
              <tr>
                <th className="px-6 py-4 font-semibold">Annonce</th>
                <th className="px-6 py-4 font-semibold">Propriétaire</th>
                <th className="px-6 py-4 font-semibold">Prix</th>
                <th className="px-6 py-4 font-semibold">Statut</th>
                <th className="px-6 py-4 font-semibold">Créée le</th>
                <th className="px-6 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {listings.map((l) => (
                <tr key={l.id} className="hover:bg-neutral-900/50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <Link
                        href={`/annonces/${l.id}`}
                        target="_blank"
                        className="font-semibold text-white hover:text-primary-400 flex items-center gap-1.5"
                      >
                        {l.title}
                        <ExternalLink className="h-3.5 w-3.5 text-neutral-500" />
                      </Link>
                      <p className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" />
                        {l.city} · {getPropertyTypeLabel(l.type || l.property_type || "APARTMENT")}
                      </p>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <p className="font-semibold text-white">
                      {l.profiles?.name || l.profiles?.full_name || "Propriétaire"}
                    </p>
                    <p className="text-xs text-neutral-400">{l.profiles?.email}</p>
                  </td>

                  <td className="px-6 py-4 font-bold text-primary-400">
                    {formatPrice(l.price)}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span
                        className={cn(
                          "inline-block rounded-full px-2.5 py-0.5 text-xs font-bold uppercase text-center w-fit",
                          (l.status === "APPROVED" || l.is_published)
                            ? "bg-green-950 text-green-400 border border-green-800"
                            : "bg-neutral-800 text-neutral-400 border border-neutral-700"
                        )}
                      >
                        {(l.status === "APPROVED" || l.is_published) ? "Publiée" : "Masquée"}
                      </span>
                      {l.is_featured && (
                        <span className="inline-block rounded-full bg-yellow-950 text-yellow-400 border border-yellow-800 px-2 py-0.5 text-[10px] font-bold uppercase w-fit">
                          En Vedette
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-xs text-neutral-400">
                    {formatDate(l.created_at)}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <ListingActionButtons
                      listingId={l.id}
                      isPublished={l.status === "APPROVED" || l.is_published}
                      isFeatured={!!l.is_featured}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
