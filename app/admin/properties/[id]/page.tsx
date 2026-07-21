import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, MapPin, Tag } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { formatPrice, formatDate, getPropertyTypeLabel } from "@/lib/utils";
import { ListingActionButtons } from "@/components/admin/listing-action-buttons";

export const metadata: Metadata = {
  title: "Détail de la propriété — Admin",
};

export default async function AdminPropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createAdminClient();

  let { data: property } = await supabase
    .from("properties")
    .select("*, profiles!inner(id, name, full_name, email, phone), property_images(*)")
    .eq("id", id)
    .single();

  if (!property) {
    const { data: legacy } = await supabase
      .from("listings")
      .select("*, profiles!inner(id, name, full_name, email, phone)")
      .eq("id", id)
      .single();
    property = legacy as any;
  }

  if (!property) {
    notFound();
  }

  const owner = property.profiles;

  return (
    <div className="animate-fade-in space-y-6">
      <Link
        href="/admin/annonces"
        className="inline-flex items-center gap-2 text-sm font-medium text-neutral-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à la liste des annonces
      </Link>

      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-6">
          <div>
            <span className="rounded-full bg-primary-950 text-primary-400 border border-primary-800 px-3 py-1 text-xs font-bold uppercase">
              {getPropertyTypeLabel(property.type || property.property_type || "HOUSE")}
            </span>
            <h1 className="text-2xl font-bold text-white mt-2">{property.title}</h1>
            <p className="text-xs text-neutral-400 flex items-center gap-1 mt-1">
              <MapPin className="h-3.5 w-3.5" />
              {property.district || property.neighborhood || property.city}, {property.city}
            </p>
          </div>

          <ListingActionButtons
            listingId={property.id}
            isPublished={property.status === "APPROVED" || property.is_published}
            isFeatured={!!property.is_featured}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-sm">
          <div className="rounded-xl border border-neutral-900 bg-neutral-900/50 p-4">
            <span className="text-xs font-semibold uppercase text-neutral-500">Prix</span>
            <p className="font-extrabold text-primary-400 text-lg mt-1">{formatPrice(property.price)}</p>
          </div>

          <div className="rounded-xl border border-neutral-900 bg-neutral-900/50 p-4">
            <span className="text-xs font-semibold uppercase text-neutral-500">Propriétaire</span>
            <p className="font-bold text-white mt-1">{owner.name || owner.full_name || "Propriétaire"}</p>
            <p className="text-xs text-neutral-400">{owner.email}</p>
          </div>

          <div className="rounded-xl border border-neutral-900 bg-neutral-900/50 p-4">
            <span className="text-xs font-semibold uppercase text-neutral-500">Date de création</span>
            <p className="font-bold text-white mt-1">{formatDate(property.created_at)}</p>
          </div>
        </div>

        <div>
          <h3 className="text-base font-bold text-white mb-2">Description</h3>
          <p className="text-sm leading-relaxed text-neutral-300 whitespace-pre-line bg-neutral-900/50 p-4 rounded-xl border border-neutral-900">
            {property.description}
          </p>
        </div>
      </div>
    </div>
  );
}
