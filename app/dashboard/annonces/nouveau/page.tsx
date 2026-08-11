"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ArrowLeft, Send, Save, Building2 } from "lucide-react";
import { listingSchema, type ListingFormData, NIGER_CITIES } from "@/lib/validations/listing";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/ui/image-uploader";
import { useToast } from "@/components/ui/toast-notification";
import { cn } from "@/lib/utils";

export default function NewListingPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [submitTargetStatus, setSubmitTargetStatus] = useState<"DRAFT" | "PENDING">("PENDING");
  const router = useRouter();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      transactionType: "RENT",
      propertyType: "HOUSE",
      city: "Niamey",
      district: "",
      rooms: 1,
      bathrooms: 1,
      furnished: false,
      rentalPeriod: "MONTHLY",
      images: [],
    },
  });

  const selectedTransaction = watch("transactionType") || "RENT";
  const isRent = selectedTransaction.toUpperCase() === "RENT";
  const selectedFurnished = watch("furnished") ?? false;

  async function onSubmit(data: any) {
    setServerError(null);

    try {
      const response = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          status: submitTargetStatus,
          images: uploadedImages,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const errorMsg =
          result.error?.message || "Erreur lors de la création de l'annonce.";
        setServerError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      router.push("/dashboard/annonces");
      router.refresh();
    } catch (err: any) {
      const errorMsg = err.message || "Erreur de connexion au serveur.";
      setServerError(errorMsg);
      toast.error(errorMsg);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 sm:p-6 lg:p-8 animate-fade-in text-left">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-6">
        <div>
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-neutral-500 hover:text-[var(--color-primary)] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Retour à mes annonces
          </button>
          <h1 className="text-h2 font-bold text-[var(--color-text)]">
            Publier une nouvelle annonce
          </h1>
          <p className="text-small text-neutral-500">
            Remplissez les détails de votre bien pour les acheteurs ou locataires au Niger
          </p>
        </div>
      </div>

      {/* Server Error Alert */}
      {serverError && (
        <div className="rounded-2xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 p-4 text-xs font-medium text-[var(--color-danger)] animate-fade-in">
          {serverError}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Transaction Type Radio Selector */}
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg)] p-6 space-y-3">
          <label className="block text-sm font-semibold text-[var(--color-text)]">
            Type de transaction *
          </label>
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: "RENT", label: "Location", desc: "Bien à louer au mois" },
              { value: "SALE", label: "Vente", desc: "Bien en vente définitive" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setValue("transactionType", option.value as any)}
                className={cn(
                  "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all text-center",
                  selectedTransaction.toUpperCase() === option.value
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)] font-bold"
                    : "border-[var(--color-border)] text-neutral-600 hover:border-neutral-300"
                )}
              >
                <span className="text-base font-bold">{option.label}</span>
                <span className="text-xs text-neutral-400">{option.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* General Info Card */}
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg)] p-6 space-y-6">
          <h2 className="text-h4 font-bold text-[var(--color-text)]">Informations générales</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Type de bien *"
              {...register("propertyType")}
              error={errors.propertyType?.message as string}
              options={[
                { value: "HOUSE", label: "Maison" },
                { value: "APARTMENT", label: "Appartement" },
                { value: "ROOM", label: "Chambre / Studio" },
                { value: "VILLA", label: "Villa" },
                { value: "OFFICE", label: "Bureau" },
                { value: "SHOP", label: "Boutique / Local commercial" },
                { value: "LAND", label: "Terrain" },
                { value: "RESIDENCE", label: "Résidence" },
              ]}
            />

            <Input
              label="Prix (FCFA) *"
              type="number"
              placeholder="Ex: 150000"
              {...register("price")}
              error={errors.price?.message as string}
            />
          </div>

          <Input
            label="Titre de l'annonce *"
            placeholder="Ex: Belle villa F4 cour unique avec jardin à Niamey"
            {...register("title")}
            error={errors.title?.message as string}
          />

          <Textarea
            label="Description détaillée *"
            rows={5}
            placeholder="Décrivez votre bien en détail (équipements, sécurité, accès, commodités)..."
            {...register("description")}
            error={errors.description?.message as string}
          />
        </div>

        {/* Location Card */}
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg)] p-6 space-y-6">
          <h2 className="text-h4 font-bold text-[var(--color-text)]">Localisation</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Ville *"
              {...register("city")}
              error={errors.city?.message as string}
              options={NIGER_CITIES.map((c) => ({ value: c, label: c }))}
            />

            <Input
              label="Quartier / District *"
              placeholder="Ex: Plateau, Koubia, Harobanda..."
              {...register("district")}
              error={errors.district?.message as string}
            />
          </div>

          <Input
            label="Adresse exacte (optionnel)"
            placeholder="Ex: Rue 102, porte 45"
            {...register("address")}
            error={errors.address?.message as string}
          />
        </div>

        {/* Caractéristiques Card */}
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg)] p-6 space-y-6">
          <h2 className="text-h4 font-bold text-[var(--color-text)]">Caractéristiques du bien</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Nombre de pièces"
              type="number"
              min={0}
              {...register("rooms")}
              error={errors.rooms?.message as string}
            />

            <Input
              label="Salles de bain"
              type="number"
              min={0}
              {...register("bathrooms")}
              error={errors.bathrooms?.message as string}
            />

            <Input
              label="Superficie (m²)"
              type="number"
              min={0}
              placeholder="Ex: 250"
              {...register("surface")}
              error={errors.surface?.message as string}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[var(--color-text)]">
                Ameublement
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: false, label: "Non meublé" },
                  { value: true, label: "Meublé" },
                ].map((option) => (
                  <button
                    key={String(option.value)}
                    type="button"
                    onClick={() => setValue("furnished", option.value)}
                    className={cn(
                      "rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-all",
                      selectedFurnished === option.value
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)] font-bold"
                        : "border-[var(--color-border)] text-neutral-600 hover:border-neutral-300"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {isRent && (
              <Select
                label="Période de location *"
                {...register("rentalPeriod")}
                error={errors.rentalPeriod?.message as string}
                options={[
                  { value: "DAILY", label: "Journalière" },
                  { value: "MONTHLY", label: "Mensuelle" },
                  { value: "YEARLY", label: "Annuelle" },
                ]}
              />
            )}
          </div>
        </div>

        {/* Upload d'images HTML5 WebP */}
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg)] p-6 space-y-4">
          <h2 className="text-h4 font-bold text-[var(--color-text)]">Photos du bien (max 10)</h2>
          <p className="text-xs text-neutral-500">
            Les images sont automatiquement optimisées au format WebP avant téléversement.
          </p>

          <ImageUploader
            bucketName="property-images"
            maxFiles={10}
            onImagesChange={(urls) => setUploadedImages(urls)}
          />
        </div>

        {/* Submit Actions */}
        <div className="flex flex-col sm:flex-row gap-4 border-t border-[var(--color-border)] pt-6">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => router.back()}
          >
            Annuler
          </Button>

          <div className="flex-1 flex flex-col sm:flex-row gap-3 justify-end">
            <Button
              type="submit"
              variant="secondary"
              size="lg"
              isLoading={isSubmitting && submitTargetStatus === "DRAFT"}
              onClick={() => setSubmitTargetStatus("DRAFT")}
              leftIcon={<Save className="h-4 w-4" />}
            >
              Enregistrer en brouillon
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting && submitTargetStatus === "PENDING"}
              onClick={() => setSubmitTargetStatus("PENDING")}
              leftIcon={<Send className="h-4 w-4" />}
            >
              Soumettre pour validation
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
