import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/helpers";
import { PropertyEditForm } from "@/components/forms/property-edit-form";

export const metadata: Metadata = {
  title: "Modifier l'annonce",
};

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile } = await requireRole("owner");
  const supabase = await createClient();

  let { data: property } = await supabase
    .from("properties")
    .select("*, property_images(*)")
    .eq("id", id)
    .single();

  if (!property) {
    const { data: legacy } = await supabase
      .from("listings")
      .select("*")
      .eq("id", id)
      .single();
    property = legacy as any;
  }

  if (!property) {
    notFound();
  }

  // Ensure owner matches logged in profile (or admin)
  const isOwner = (property.ownerId || property.owner_id) === profile.id;
  const isAdmin = (profile.role ?? "").toUpperCase() === "ADMIN";

  if (!isOwner && !isAdmin) {
    redirect("/dashboard/annonces");
  }

  return (
    <div className="animate-fade-in max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Modifier l&apos;annonce</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Mettez à jour les informations et caractéristiques de votre bien
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-card)]">
        <PropertyEditForm initialData={property} />
      </div>
    </div>
  );
}
