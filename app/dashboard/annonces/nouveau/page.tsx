"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload, X, ImageIcon } from "lucide-react";
import { listingSchema, type ListingFormData, AMENITIES_OPTIONS, NIGER_CITIES } from "@/lib/validations/listing";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function NewListingPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<any>({
    resolver: zodResolver(listingSchema) as any,
  });

  const selectedAmenities = watch("amenities");

  function toggleAmenity(amenity: string) {
    const current = selectedAmenities ?? [];
    if (current.includes(amenity)) {
      setValue("amenities", current.filter((a: any) => a !== amenity));
    } else {
      setValue("amenities", [...current, amenity]);
    }
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const maxFiles = 6;
    const newFiles = files.slice(0, maxFiles - imageFiles.length);

    setImageFiles((prev) => [...prev, ...newFiles]);

    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreviews((prev) => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  }

  function removeImage(index: number) {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function onSubmit(data: ListingFormData) {
    setServerError(null);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setServerError("Vous devez être connecté pour publier une annonce.");
      return;
    }

    // Upload images to Supabase Storage
    const uploadedUrls: string[] = [];
    for (const file of imageFiles) {
      const ext = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("listings")
        .upload(fileName, file, { contentType: file.type });

      if (uploadError) {
        setServerError("Erreur lors de l'upload des images. Veuillez réessayer.");
        return;
      }

      const { data: urlData } = supabase.storage
        .from("listings")
        .getPublicUrl(fileName);

      uploadedUrls.push(urlData.publicUrl);
    }

    // Create the property
    const { data: propData, error } = await supabase
      .from("properties")
      .insert({
        owner_id: user.id,
        title: data.title,
        description: data.description || data.title,
        type: (data.propertyType ?? "APARTMENT").toUpperCase() as any,
        price: data.price,
        city: data.city,
        district: data.district || data.city,
        address: data.address || null,
        rooms: data.rooms ?? 1,
        bathrooms: data.bathrooms ?? 1,
        surface: data.surface ?? null,
        status: "PENDING" as any,
      })
      .select("id")
      .single();

    if (error) {
      // Fallback insert to listings table if legacy schema is active
      const { error: legacyError } = await supabase.from("listings").insert({
        owner_id: user.id,
        title: data.title,
        description: data.description || null,
        property_type: (data.propertyType ?? "apartment").toLowerCase() as any,
        transaction_type: "rent" as any,
        price: data.price,
        city: data.city,
        neighborhood: data.district || null,
        address: data.address || null,
        bedrooms: data.rooms ?? null,
        bathrooms: data.bathrooms ?? null,
        area_sqm: data.surface ?? null,
        amenities: [],
        images: uploadedUrls,
      });

      if (legacyError) {
        setServerError("Erreur lors de la publication. Veuillez vérifier vos autorisations.");
        return;
      }
    } else if (propData && uploadedUrls.length > 0) {
      // Insert images into property_images
      const imageRows = uploadedUrls.map((url, i) => ({
        property_id: propData.id,
        url,
        order: i,
      }));
      await supabase.from("property_images").insert(imageRows);
    }

    router.push("/dashboard/annonces");
    router.refresh();
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-neutral-900">
        Publier une annonce
      </h1>
      <p className="mt-1 text-neutral-600">
        Remplissez les informations de votre bien
      </p>

      {serverError && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-8 space-y-8"
      >
        {/* Transaction type */}
        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">
            Type de transaction *
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: "rent" as const, label: "Location" },
              { value: "sale" as const, label: "Vente" },
            ].map((option) => (
              <label
                key={option.value}
                className={cn(
                  "flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all",
                  watch("transactionType") === option.value
                    ? "border-primary-500 bg-primary-50 text-primary-700"
                    : "border-[var(--border)] text-neutral-600 hover:border-neutral-300"
                )}
              >
                <input
                  type="radio"
                  value={option.value}
                  {...register("transactionType")}
                  className="sr-only"
                />
                {option.label}
              </label>
            ))}
          </div>
          {errors.transactionType && (
            <p className="mt-1 text-xs text-red-500">{errors.transactionType.message as string}</p>
          )}
        </div>

        {/* Property type */}
        <div>
          <label htmlFor="property-type" className="mb-1.5 block text-sm font-medium text-neutral-700">
            Type de bien *
          </label>
          <select
            id="property-type"
            {...register("propertyType")}
            className="w-full rounded-xl border border-[var(--border)] bg-neutral-50 px-4 py-3 text-sm transition-colors focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          >
            <option value="">Sélectionnez...</option>
            <option value="HOUSE">Maison</option>
            <option value="APARTMENT">Appartement</option>
            <option value="ROOM">Chambre / Studio</option>
            <option value="VILLA">Villa</option>
            <option value="OFFICE">Bureau</option>
            <option value="SHOP">Boutique / Local commercial</option>
            <option value="LAND">Terrain</option>
          </select>
          {errors.propertyType && (
            <p className="mt-1 text-xs text-red-500">{errors.propertyType.message as string}</p>
          )}
        </div>

        {/* Title */}
        <div>
          <label htmlFor="listing-title" className="mb-1.5 block text-sm font-medium text-neutral-700">
            Titre de l&apos;annonce *
          </label>
          <input
            id="listing-title"
            type="text"
            placeholder="Ex: Belle villa avec jardin à Niamey"
            {...register("title")}
            className="w-full rounded-xl border border-[var(--border)] bg-neutral-50 px-4 py-3 text-sm transition-colors focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
          {errors.title && (
            <p className="mt-1 text-xs text-red-500">{errors.title.message as string}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="listing-desc" className="mb-1.5 block text-sm font-medium text-neutral-700">
            Description *
          </label>
          <textarea
            id="listing-desc"
            rows={5}
            placeholder="Décrivez votre bien en détail..."
            {...register("description")}
            className="w-full rounded-xl border border-[var(--border)] bg-neutral-50 px-4 py-3 text-sm transition-colors focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
          {errors.description && (
            <p className="mt-1 text-xs text-red-500">{errors.description.message as string}</p>
          )}
        </div>

        {/* Price */}
        <div>
          <label htmlFor="listing-price" className="mb-1.5 block text-sm font-medium text-neutral-700">
            Prix (FCFA) *
          </label>
          <input
            id="listing-price"
            type="number"
            placeholder="150000"
            {...register("price", { valueAsNumber: true })}
            className="w-full rounded-xl border border-[var(--border)] bg-neutral-50 px-4 py-3 text-sm transition-colors focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
          {errors.price && (
            <p className="mt-1 text-xs text-red-500">{errors.price.message as string}</p>
          )}
        </div>

        {/* Location */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="listing-city" className="mb-1.5 block text-sm font-medium text-neutral-700">
              Ville *
            </label>
            <select
              id="listing-city"
              {...register("city")}
              className="w-full rounded-xl border border-[var(--border)] bg-neutral-50 px-4 py-3 text-sm transition-colors focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="">Sélectionnez...</option>
              {NIGER_CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            {errors.city && (
              <p className="mt-1 text-xs text-red-500">{errors.city.message as string}</p>
            )}
          </div>
          <div>
            <label htmlFor="listing-neighborhood" className="mb-1.5 block text-sm font-medium text-neutral-700">
              Quartier
            </label>
            <input
              id="listing-neighborhood"
              type="text"
              placeholder="Ex: Plateau"
              {...register("neighborhood")}
              className="w-full rounded-xl border border-[var(--border)] bg-neutral-50 px-4 py-3 text-sm transition-colors focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="listing-bedrooms" className="mb-1.5 block text-sm font-medium text-neutral-700">
              Chambres
            </label>
            <input
              id="listing-bedrooms"
              type="number"
              placeholder="0"
              min={0}
              {...register("bedrooms", { valueAsNumber: true })}
              className="w-full rounded-xl border border-[var(--border)] bg-neutral-50 px-4 py-3 text-sm transition-colors focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
          <div>
            <label htmlFor="listing-bathrooms" className="mb-1.5 block text-sm font-medium text-neutral-700">
              Salles de bain
            </label>
            <input
              id="listing-bathrooms"
              type="number"
              placeholder="0"
              min={0}
              {...register("bathrooms", { valueAsNumber: true })}
              className="w-full rounded-xl border border-[var(--border)] bg-neutral-50 px-4 py-3 text-sm transition-colors focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
          <div>
            <label htmlFor="listing-area" className="mb-1.5 block text-sm font-medium text-neutral-700">
              Superficie (m²)
            </label>
            <input
              id="listing-area"
              type="number"
              placeholder="0"
              min={0}
              {...register("areaSqm", { valueAsNumber: true })}
              className="w-full rounded-xl border border-[var(--border)] bg-neutral-50 px-4 py-3 text-sm transition-colors focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
        </div>

        {/* Amenities */}
        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">
            Équipements & services
          </label>
          <div className="flex flex-wrap gap-2">
            {AMENITIES_OPTIONS.map((amenity) => (
              <button
                key={amenity}
                type="button"
                onClick={() => toggleAmenity(amenity)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm transition-all",
                  selectedAmenities?.includes(amenity)
                    ? "border-primary-500 bg-primary-50 text-primary-700"
                    : "border-[var(--border)] text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50"
                )}
              >
                {amenity}
              </button>
            ))}
          </div>
        </div>

        {/* Image upload */}
        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">
            Photos (max. 6)
          </label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {imagePreviews.map((preview, index) => (
              <div
                key={index}
                className="relative aspect-[4/3] overflow-hidden rounded-xl border border-[var(--border)]"
              >
                <img
                  src={preview}
                  alt={`Photo ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white shadow-sm transition-colors hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}

            {imagePreviews.length < 6 && (
              <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 text-neutral-400 transition-colors hover:border-primary-400 hover:text-primary-500">
                <ImageIcon className="h-8 w-8" />
                <span className="mt-2 text-xs font-medium">Ajouter</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleImageUpload}
                  className="sr-only"
                />
              </label>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 border-t border-[var(--border)] pt-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl border border-[var(--border)] px-6 py-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Publication...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Publier l&apos;annonce
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
