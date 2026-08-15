import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Clock, MapPin, Search } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { formatPrice, getPropertyTypeLabel, formatDate, cn } from "@/lib/utils";
import { ListingActionButtons } from "@/components/admin/listing-action-buttons";
import { AdminListingsFilters } from "@/components/admin/admin-listings-filters";

export const metadata: Metadata = {
  title: "Modération des annonces — Admin",
};

export default async function AdminListingsPage(props: {
  searchParams?: Promise<{ [key: string]: string | undefined }>;
}) {
  const searchParams = (await props.searchParams) || {};
  const filterQuery = (searchParams.q || "").toLowerCase().trim();
  const filterStatus = (searchParams.status || "").toUpperCase().trim();
  const filterCity = (searchParams.city || "").toLowerCase().trim();
  const filterType = (searchParams.type || "").toUpperCase().trim();
  const startDateStr = searchParams.startDate;
  const endDateStr = searchParams.endDate;

  const hasActiveFilters = !!(
    filterQuery ||
    filterStatus ||
    filterCity ||
    filterType ||
    startDateStr ||
    endDateStr
  );

  const supabase = await createAdminClient();

  let { data: listingsData, error } = await supabase
    .from("properties")
    .select("*, owner:profiles!ownerId(id, name, email, phone), property_images(*)")
    .order("createdAt", { ascending: false });

  if (error || !listingsData) {
    const { data: retryData } = await supabase
      .from("properties")
      .select("*, profiles(id, name, email, phone), property_images(*)")
      .order("createdAt", { ascending: false });
    if (retryData) {
      listingsData = retryData;
      error = null;
    }
  }

  if (error || !listingsData || listingsData.length === 0) {
    const { data: rawProps, error: rawErr } = await supabase
      .from("properties")
      .select("*, property_images(*)")
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

  // Pending listings section (demandes en attente)
  const pendingListings = listings.filter(
    (l) => String(l.status || "PENDING").toUpperCase() === "PENDING"
  );

  // Filter listings based on search parameters (ET logique)
  const filteredListings = listings.filter((l) => {
    const statusStr = String(l.status || "PENDING").toUpperCase();
    const typeStr = String(l.type || l.property_type || "").toUpperCase();
    const cityStr = String(l.city || "").toLowerCase();
    const titleStr = String(l.title || "").toLowerCase();
    const owner = l.owner || l.profiles || {};
    const ownerName = String(owner.name || "").toLowerCase();
    const ownerEmail = String(owner.email || "").toLowerCase();

    // Status filter
    if (filterStatus && statusStr !== filterStatus) {
      return false;
    }

    // Type filter
    if (filterType && typeStr !== filterType) {
      return false;
    }

    // City filter
    if (filterCity && cityStr !== filterCity) {
      return false;
    }

    // Text search filter (title or owner name or owner email)
    if (filterQuery) {
      const matchTitle = titleStr.includes(filterQuery);
      const matchOwnerName = ownerName.includes(filterQuery);
      const matchOwnerEmail = ownerEmail.includes(filterQuery);
      if (!matchTitle && !matchOwnerName && !matchOwnerEmail) {
        return false;
      }
    }

    // Date range filter
    if (startDateStr || endDateStr) {
      const createdDate = l.createdAt || l.created_at ? new Date(l.createdAt || l.created_at) : null;
      if (createdDate && !isNaN(createdDate.getTime())) {
        if (startDateStr) {
          const start = new Date(startDateStr);
          start.setHours(0, 0, 0, 0);
          if (createdDate < start) return false;
        }
        if (endDateStr) {
          const end = new Date(endDateStr);
          end.setHours(23, 59, 59, 999);
          if (createdDate > end) return false;
        }
      }
    }

    return true;
  });

  // Historical/processed listings (excluding pending unless explicitly filtered for PENDING)
  const processedListings = hasActiveFilters
    ? filteredListings
    : listings.filter(
        (l) => String(l.status || "PENDING").toUpperCase() !== "PENDING"
      );

  const renderThumbnail = (l: any) => {
    const images = l.property_images || l.images || [];
    const firstUrl = Array.isArray(images) && images.length > 0 ? (typeof images[0] === "string" ? images[0] : images[0]?.url) : null;

    if (firstUrl) {
      return (
        <img
          src={firstUrl}
          alt={l.title || "Image annonce"}
          className="h-12 w-12 rounded-xl object-cover border border-neutral-800 flex-shrink-0 bg-neutral-900"
        />
      );
    }

    return (
      <div className="h-12 w-12 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center flex-shrink-0 text-neutral-500">
        <Building2 className="h-5 w-5 text-neutral-500" />
      </div>
    );
  };

  return (
    <div className="animate-fade-in space-y-8 font-sans">
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

      {/* Barre de filtres */}
      <AdminListingsFilters />

      {/* Compteur de résultats après filtrage */}
      <div className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/60 px-4 py-3 text-sm text-neutral-300">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-primary-400" />
          <span className="font-semibold text-white">
            {hasActiveFilters
              ? `${filteredListings.length} annonce${filteredListings.length > 1 ? "s" : ""} trouvée${filteredListings.length > 1 ? "s" : ""} selon les filtres`
              : `Historique des annonces (${processedListings.length} annonce${processedListings.length > 1 ? "s" : ""})`}
          </span>
        </div>
        <span className="text-xs text-neutral-400">
          Base totale : {listings.length} annonce{listings.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* Demandes d'annonces en attente de validation (Affichées sauf si un filtre actif restreint l'affichage) */}
      {!hasActiveFilters && (
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
                      <th className="px-4 py-3 font-semibold">Annonce</th>
                      <th className="px-4 py-3 font-semibold">Propriétaire</th>
                      <th className="px-4 py-3 font-semibold">Prix</th>
                      <th className="px-4 py-3 font-semibold">Statut</th>
                      <th className="px-4 py-3 font-semibold">Soumise le</th>
                      <th className="px-4 py-3 text-right font-semibold">Action Modération</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {pendingListings.map((l) => {
                      const owner = l.owner || l.profiles || {};
                      return (
                        <tr key={l.id} className="hover:bg-neutral-900/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {renderThumbnail(l)}
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
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <p className="font-semibold text-white">
                              {owner.name || "Propriétaire"}
                            </p>
                            <p className="text-xs text-neutral-400">{owner.email}</p>
                          </td>

                          <td className="px-4 py-3 font-bold text-primary-400">
                            {formatPrice(l.price)}
                          </td>

                          <td className="px-4 py-3">
                            <span className="inline-block rounded-full bg-yellow-950 text-yellow-400 border border-yellow-800 px-2.5 py-0.5 text-xs font-bold uppercase">
                              En attente
                            </span>
                          </td>

                          <td className="px-4 py-3 text-xs text-neutral-400">
                            {formatDate(l.createdAt || l.created_at)}
                          </td>

                          <td className="px-4 py-3 text-right">
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
      )}

      {/* Tableau principal des annonces (Historique / Filtré) */}
      <div className="space-y-4 pt-2">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          {hasActiveFilters
            ? `Résultats filtrés (${processedListings.length})`
            : `Historique des annonces publiées et traitées (${processedListings.length})`}
        </h2>

        {processedListings.length === 0 ? (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-8 text-center text-sm text-neutral-500">
            {hasActiveFilters
              ? "Aucune annonce ne correspond aux critères de recherche définis."
              : "Aucune annonce traitée pour l'instant."}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-neutral-300">
                <thead className="bg-neutral-900 text-xs uppercase text-neutral-400">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Annonce</th>
                    <th className="px-4 py-3 font-semibold">Propriétaire</th>
                    <th className="px-4 py-3 font-semibold">Prix</th>
                    <th className="px-4 py-3 font-semibold">Statut</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {processedListings.map((l) => {
                    const statusStr = String(l.status || "APPROVED").toUpperCase();
                    const isApproved = statusStr === "APPROVED";
                    const isRejected = statusStr === "REJECTED";
                    const isHidden = statusStr === "HIDDEN";
                    const isDraft = statusStr === "DRAFT";
                    const isPending = statusStr === "PENDING";
                    const owner = l.owner || l.profiles || {};

                    return (
                      <tr key={l.id} className="hover:bg-neutral-900/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {renderThumbnail(l)}
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
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <p className="font-semibold text-white">
                            {owner.name || "Propriétaire"}
                          </p>
                          <p className="text-xs text-neutral-400">{owner.email}</p>
                        </td>

                        <td className="px-4 py-3 font-bold text-primary-400">
                          {formatPrice(l.price)}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-block rounded-full px-2.5 py-0.5 text-xs font-bold uppercase text-center w-fit",
                              isApproved
                                ? "bg-green-950 text-green-400 border border-green-800"
                                : isRejected
                                  ? "bg-red-950 text-red-400 border border-red-800"
                                  : isHidden
                                    ? "bg-neutral-800 text-neutral-400 border border-neutral-700"
                                    : isDraft
                                      ? "bg-blue-950 text-blue-400 border border-blue-800"
                                      : "bg-yellow-950 text-yellow-400 border border-yellow-800"
                            )}
                          >
                            {isApproved
                              ? "Approuvée"
                              : isRejected
                                ? "Rejetée"
                                : isHidden
                                  ? "Masquée"
                                  : isDraft
                                    ? "Brouillon"
                                    : "En attente"}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-xs text-neutral-400">
                          {formatDate(l.createdAt || l.created_at)}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <ListingActionButtons
                            listingId={l.id}
                            status={statusStr as any}
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
