"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { listingSchema, NIGER_CITIES } from "@/lib/validations/listing";
import { cn } from "@/lib/utils";
import { DeletePropertyButton } from "@/components/properties/delete-property-button";

type PropertyEditFormProps = {
  initialData: any;
};

export function PropertyEditForm({ initialData }: PropertyEditFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<any>({
    resolver: zodResolver(listingSchema) as any,
    defaultValues: {
      title: initialData.title,
      description: initialData.description,
      propertyType: initialData.type || initialData.property_type || "HOUSE",
      transactionType: String(initialData.transactionType || initialData.transaction_type || "RENT").toUpperCase(),
      price: initialData.price,
      city: initialData.city,
      district: initialData.district || initialData.neighborhood || initialData.city,
      address: initialData.address || "",
      rooms: initialData.rooms || initialData.bedrooms || 1,
      bathrooms: initialData.bathrooms || 1,
      surface: initialData.surface || initialData.area_sqm || null,
      furnished: Boolean(initialData.furnished),
      rentalPeriod: String(initialData.rentalPeriod || "MONTHLY").toUpperCase(),
    },
  });

  const selectedTransaction = watch("transactionType") || "RENT";
  const isRent = String(selectedTransaction).toUpperCase() === "RENT";
  const selectedFurnished = watch("furnished") ?? false;

  async function onSubmit(formData: any) {
    setServerError(null);
    const supabase = createClient();

    try {
      // Update property record
      const { error: propErr } = await supabase
        .from("properties")
        .update({
          title: formData.title,
          description: formData.description,
          type: formData.propertyType.toUpperCase(),
          transactionType: formData.transactionType.toUpperCase(),
          price: formData.price,
          city: formData.city,
          district: formData.district,
          address: formData.address || null,
          rooms: formData.rooms,
          bathrooms: formData.bathrooms,
          surface: formData.surface || null,
          furnished: Boolean(formData.furnished),
          rentalPeriod: formData.transactionType.toUpperCase() === "RENT"
            ? (formData.rentalPeriod || null)
            : null,
        } as any)
        .eq("id", initialData.id);

      if (propErr) {
        // Fallback update legacy listings table
        await supabase
          .from("listings")
          .update({
            title: formData.title,
            description: formData.description,
            price: formData.price,
            city: formData.city,
            neighborhood: formData.district,
            address: formData.address || null,
            bedrooms: formData.rooms,
            bathrooms: formData.bathrooms,
            area_sqm: formData.surface || null,
          } as any)
          .eq("id", initialData.id);
      }

      router.push("/dashboard/annonces");
      router.refresh();
    } catch (err: any) {
      setServerError(err.message || "Erreur lors de la mise à jour");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {serverError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Titre de l&apos;annonce *
        </label>
        <input
          type="text"
          {...register("title")}
          className="w-full rounded-xl border border-[var(--border)] bg-neutral-50 px-4 py-3 text-sm focus:border-primary-500 focus:bg-white focus:outline-none"
        />
        {errors.title && (
          <p className="mt-1 text-xs text-red-500">{errors.title.message as string}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Type de bien *
        </label>
        <select
          {...register("propertyType")}
          className="w-full rounded-xl border border-[var(--border)] bg-neutral-50 px-4 py-3 text-sm focus:border-primary-500 focus:bg-white focus:outline-none"
        >
          <option value="HOUSE">Maison</option>
          <option value="APARTMENT">Appartement</option>
          <option value="ROOM">Chambre / Studio</option>
          <option value="VILLA">Villa</option>
          <option value="OFFICE">Bureau</option>
          <option value="SHOP">Boutique / Local commercial</option>
          <option value="LAND">Terrain</option>
          <option value="RESIDENCE">Résidence</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Type de transaction *
        </label>
        <select
          {...register("transactionType")}
          className="w-full rounded-xl border border-[var(--border)] bg-neutral-50 px-4 py-3 text-sm focus:border-primary-500 focus:bg-white focus:outline-none"
        >
          <option value="RENT">Location</option>
          <option value="SALE">Vente</option>
        </select>
        {errors.transactionType && (
          <p className="mt-1 text-xs text-red-500">{errors.transactionType.message as string}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Ameublement
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: false, label: "Non meublé" },
              { value: true, label: "Meublé" },
            ].map((option) => (
              <button
                key={String(option.value)}
                type="button"
                onClick={() => setValue("furnished", option.value)}
                className={cn(
                  "rounded-xl border px-3 py-3 text-sm font-medium transition-all",
                  selectedFurnished === option.value
                    ? "border-primary-500 bg-primary-50 text-primary-700 font-semibold"
                    : "border-[var(--border)] bg-neutral-50 text-neutral-600 hover:bg-neutral-100"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {isRent && (
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Période de location *
            </label>
            <select
              {...register("rentalPeriod")}
              className="w-full rounded-xl border border-[var(--border)] bg-neutral-50 px-4 py-3 text-sm focus:border-primary-500 focus:bg-white focus:outline-none"
            >
              <option value="DAILY">Journalière</option>
              <option value="MONTHLY">Mensuelle</option>
              <option value="YEARLY">Annuelle</option>
            </select>
            {errors.rentalPeriod && (
              <p className="mt-1 text-xs text-red-500">{errors.rentalPeriod.message as string}</p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Prix (FCFA) *
          </label>
          <input
            type="number"
            {...register("price", { valueAsNumber: true })}
            className="w-full rounded-xl border border-[var(--border)] bg-neutral-50 px-4 py-3 text-sm focus:border-primary-500 focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Ville *
          </label>
          <select
            {...register("city")}
            className="w-full rounded-xl border border-[var(--border)] bg-neutral-50 px-4 py-3 text-sm focus:border-primary-500 focus:bg-white focus:outline-none"
          >
            {NIGER_CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Quartier / District *
        </label>
        <input
          type="text"
          {...register("district")}
          className="w-full rounded-xl border border-[var(--border)] bg-neutral-50 px-4 py-3 text-sm focus:border-primary-500 focus:bg-white focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Description *
        </label>
        <textarea
          rows={5}
          {...register("description")}
          className="w-full rounded-xl border border-[var(--border)] bg-neutral-50 px-4 py-3 text-sm focus:border-primary-500 focus:bg-white focus:outline-none"
        />
      </div>

      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[var(--border)]">
        <DeletePropertyButton
          propertyId={initialData.id}
          propertyTitle={initialData.title}
          redirectOnDelete="/dashboard/annonces"
          variant="button"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Enregistrer les modifications
        </button>
      </div>
    </form>
  );
}
