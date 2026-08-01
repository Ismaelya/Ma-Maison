import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Clock, MapPin } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { formatPrice, getPropertyTypeLabel, formatDate, cn } from "@/lib/utils";
import { ListingActionButtons } from "@/components/admin/listing-action-buttons";

export const metadata: Metadata = {
  title: "Modération des annonces — Admin",
};

export default async function AdminListingsPage() {
  const supabase = await createAdminClient();

  let { data: listingsData, error } = await supabase
    .from("properties")
    .select("*, owner:profiles!ownerId(id, name, email, phone)")
    .order("createdAt", { ascending: false });

  if (error || !listingsData) {
    const { data: retryData } = await supabase
      .from("properties")
      .select("*, profiles(id, name, email, phone)")
      .order("createdAt", { ascending: false });
    if (retryData) {
      listingsData = retryData;
      error = null;
    }
  }

  if (error || !listingsData || listingsData.length === 0) {
    const { data: rawProps, error: rawErr } = await supabase
      .from("properties")
      .select("*")
      .order("createdAt", { ascending: false });

    if (rawProps && rawProps.length > 0) {
      const { data: allProfiles } = await supabase
        .from("profiles")
        .select("id, name, email, phone");
      const profileMap = new Map((allProfiles ?? []).map((p) => [p.id, p]));

      listingsData = rawProps.map((p) => ({
        ...p,
        owner: profileMap.get(p.ownerId || p.owner_id || p.userId || p.user_id),
      }));
      error = rawErr;
    }
  }

  const listings = (listingsData ?? []) as any[];

  const pendingListings = listings.filter(
    (l) => String(l.status || "PENDING").toUpperCase() === "PENDING"
  );
  const processedListings = listings.filter(
    (l) => String(l.status || "PENDING").toUpperCase() !== "PENDING"
  );

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Modération des annonces</h1>
        <p className="mt-1 text-sm text-neutral-400">
          {listings.length} annonce{listings.length > 1 ? "s" : ""} au total · {pendingListings.length} en attente de validation
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-800 bg-red-950/50 p-4 text-sm text-red-300">
          Erreur lors du chargement des annonces : {error.message}
        </div>
      )}

      {/* Demandes d'annonces en attente de validation */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-yellow-400 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Demandes d&apos;annonces en attente de validation ({pendingListings.length})
        </h2>

        {pendingListings.length === 0 ? (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-8 text-center text-sm text-neutral-500">
            Aucune demande d&apos;annonce en attente de validation.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-yellow-800/80 bg-neutral-950 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-neutral-300">
                <thead className="bg-neutral-900 text-xs uppercase text-neutral-400">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Annonce</th>
                    <th className="px-6 py-4 font-semibold">Propriétaire</th>
                    <th className="px-6 py-4 font-semibold">Prix</th>
                    <th className="px-6 py-4 font-semibold">Statut</th>
                    <th className="px-6 py-4 font-semibold">Soumise le</th>
                    <th className="px-6 py-4 text-right font-semibold">Action Modération</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {pendingListings.map((l) => {
                    const owner = l.owner || l.profiles || {};
                    return (
                      <tr key={l.id} className="hover:bg-neutral-900/50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <Link
                              href={`/admin/annonces/${l.id}`}
                              className="font-semibold text-white hover:text-primary-400 flex items-center gap-1.5"
                            >
                              {l.title}
                            </Link>
                            <p className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3" />
                              {l.city} · {getPropertyTypeLabel(l.type || l.property_type || "HOUSE")}
                            </p>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-semibold text-white">
                            {owner.name || owner.full_name || "Propriétaire"}
                          </p>
                          <p className="text-xs text-neutral-400">{owner.email}</p>
                        </td>

                        <td className="px-6 py-4 font-bold text-primary-400">
                          {formatPrice(l.price)}
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-block rounded-full bg-yellow-950 text-yellow-400 border border-yellow-800 px-2.5 py-0.5 text-xs font-bold uppercase">
                            En attente
                          </span>
                        </td>

                        <td className="px-6 py-4 text-xs text-neutral-400">
                          {formatDate(l.createdAt || l.created_at)}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <ListingActionButtons
                            listingId={l.id}
                            status="PENDING"
                            isPublished={false}
                            isFeatured={!!l.is_featured}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Toutes les annonces publiées ou traitées */}
      <div className="space-y-4 pt-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          Historique des annonces publiées et traitées ({processedListings.length})
        </h2>

        {processedListings.length === 0 ? (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-8 text-center text-sm text-neutral-500">
            Aucune annonce traitée pour l&apos;instant.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-neutral-300">
                <thead className="bg-neutral-900 text-xs uppercase text-neutral-400">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Annonce</th>
                    <th className="px-6 py-4 font-semibold">Propriétaire</th>
                    <th className="px-6 py-4 font-semibold">Prix</th>
                    <th className="px-6 py-4 font-semibold">Statut</th>
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {processedListings.map((l) => {
                    const statusStr = String(l.status || "APPROVED").toUpperCase();
                    const isApproved = statusStr === "APPROVED";
                    const owner = l.owner || l.profiles || {};

                    return (
                      <tr key={l.id} className="hover:bg-neutral-900/50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <Link
                              href={`/admin/annonces/${l.id}`}
                              className="font-semibold text-white hover:text-primary-400 flex items-center gap-1.5"
                            >
                              {l.title}
                            </Link>
                            <p className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3" />
                              {l.city} · {getPropertyTypeLabel(l.type || l.property_type || "HOUSE")}
                            </p>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-semibold text-white">
                            {owner.name || owner.full_name || "Propriétaire"}
                          </p>
                          <p className="text-xs text-neutral-400">{owner.email}</p>
                        </td>

                        <td className="px-6 py-4 font-bold text-primary-400">
                          {formatPrice(l.price)}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={cn(
                              "inline-block rounded-full px-2.5 py-0.5 text-xs font-bold uppercase text-center w-fit",
                              isApproved
                                ? "bg-green-950 text-green-400 border border-green-800"
                                : statusStr === "REJECTED"
                                  ? "bg-red-950 text-red-400 border border-red-800"
                                  : "bg-neutral-800 text-neutral-400 border border-neutral-700"
                            )}
                          >
                            {isApproved ? "Approuvée" : statusStr === "REJECTED" ? "Refusée" : "Masquée"}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-xs text-neutral-400">
                          {formatDate(l.createdAt || l.created_at)}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <ListingActionButtons
                            listingId={l.id}
                            status={statusStr}
                            isPublished={isApproved}
                            isFeatured={!!l.is_featured}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
