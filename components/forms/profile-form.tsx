"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, User } from "lucide-react";
import { profileSchema, type ProfileFormData } from "@/lib/validations/profile";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";
import { cn } from "@/lib/utils";

type ProfileFormProps = {
  profile: Profile;
};

export function ProfileForm({ profile }: ProfileFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: profile.full_name ?? "",
      phone: profile.phone ?? "",
    },
  });

  async function onSubmit(data: ProfileFormData) {
    setServerError(null);
    setSuccess(false);
    const supabase = createClient();

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: data.fullName,
        phone: data.phone || null,
      })
      .eq("id", profile.id);

    if (error) {
      setServerError("Erreur lors de la mise à jour. Veuillez réessayer.");
      return;
    }

    setSuccess(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {serverError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Profil mis à jour avec succès !
        </div>
      )}

      <div>
        <label
          htmlFor="profile-name"
          className="mb-1.5 block text-sm font-medium text-neutral-700"
        >
          Nom complet
        </label>
        <input
          id="profile-name"
          type="text"
          {...register("fullName")}
          className="w-full rounded-xl border border-[var(--border)] bg-neutral-50 px-4 py-3 text-sm transition-colors focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        />
        {errors.fullName && (
          <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="profile-phone"
          className="mb-1.5 block text-sm font-medium text-neutral-700"
        >
          Téléphone
        </label>
        <input
          id="profile-phone"
          type="tel"
          {...register("phone")}
          className="w-full rounded-xl border border-[var(--border)] bg-neutral-50 px-4 py-3 text-sm transition-colors focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        />
        {errors.phone && (
          <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">
          Email
        </label>
        <input
          type="email"
          value={profile.email}
          disabled
          className="w-full rounded-xl border border-[var(--border)] bg-neutral-100 px-4 py-3 text-sm text-neutral-500"
        />
        <p className="mt-1 text-xs text-neutral-400">
          L&apos;email ne peut pas être modifié
        </p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !isDirty}
        className="flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Enregistrement...
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            Enregistrer
          </>
        )}
      </button>
    </form>
  );
}
