import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { requireRole } from "@/lib/auth/helpers";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, formatRelativeTime, cn } from "@/lib/utils";
import type { Listing } from "@/types";

export const metadata: Metadata = {
  title: "Mes annonces",
};

export default async function MyListingsPage() {
  const { profile } = await requireRole("owner");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("properties")
    .select("*, property_images(url)")
    .eq("ownerId", profile.id)
    .order("createdAt", { ascending: false });

  const listings = (data ?? []) as any[];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Mes annonces</h1>
          <p className="mt-1 text-neutral-600">
            {listings.length} annonce{listings.length !== 1 ? "s" : ""}
          </p>
        </div>
        {profile.subscription_status !== "expired" && (
          <Link
            href="/dashboard/annonces/nouveau"
            className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-700 hover:shadow-md"
          >
            <Plus className="h-4 w-4" />
            Nouvelle annonce
          </Link>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Erreur lors du chargement de vos annonces.
        </div>
      )}

      {listings.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-neutral-200 py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
            <Plus className="h-8 w-8 text-neutral-400" />
          </div>
          <p className="text-lg font-medium text-neutral-900">
            Aucune annonce
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            Publiez votre premier bien immobilier
          </p>
          {profile.subscription_status !== "expired" && (
            <Link
              href="/dashboard/annonces/nouveau"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
            >
              <Plus className="h-4 w-4" />
              Publier une annonce
            </Link>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--border)] bg-white shadow-[var(--shadow-card)]">
          {listings.map((listing, i) => (
            <div
              key={listing.id}
              className={cn(
                "flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between",
                i !== 0 && "border-t border-[var(--border)]"
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-semibold text-neutral-900">
                    {listing.title}
                  </h3>
                  <span
                    className={cn(
                      "flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
                      listing.status === "APPROVED"
                        ? "bg-green-100 text-green-700"
                        : "bg-neutral-100 text-neutral-600"
                    )}
                  >
                    {listing.status === "APPROVED" ? "Publiée" : listing.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-neutral-600">
                  {formatPrice(listing.price)} · {listing.city} ·{" "}
                  {formatRelativeTime(listing.createdAt)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/annonces/${listing.id}`}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-700"
                  title="Voir"
                >
                  <Eye className="h-4 w-4" />
                </Link>
                <Link
                  href={`/dashboard/annonces/${listing.id}/edit` as any}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-700"
                  title="Modifier"
                >
                  <Edit className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
