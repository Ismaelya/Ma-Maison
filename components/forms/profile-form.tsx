"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, Camera, Sparkles, Upload, X, CheckCircle } from "lucide-react";
import { profileSchema, type ProfileFormData } from "@/lib/validations/profile";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";
import { getAvatarUrl } from "@/lib/utils";

type ProfileFormProps = {
  profile: Profile;
};

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80",
];

export function ProfileForm({ profile }: ProfileFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const currentName = profile.name ?? "";
  const initialAvatar = profile.avatarUrl ?? "";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: currentName,
      phone: profile.phone ?? "",
      avatarUrl: initialAvatar,
    },
  });

  const watchedAvatar = watch("avatarUrl");
  const watchedName = watch("fullName");

  // ---------------------------------------------------------------
  // File upload handler — uploads to Supabase Storage "avatars" bucket
  // ---------------------------------------------------------------
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Max 5 MB
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Le fichier est trop volumineux (max 5 Mo).");
      return;
    }

    // Allow common image types
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic"];
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Format non supporté. Utilisez JPG, PNG, WEBP ou GIF.");
      return;
    }

    setUploadingPhoto(true);
    setUploadError(null);

    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `${Date.now()}.${ext}`;
      const filePath = `${profile.id}/${fileName}`;

      const { error: storageError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { contentType: file.type, upsert: true });

      if (storageError) {
        setUploadError(`Erreur lors de l'envoi de la photo : ${storageError.message}`);
        return;
      }

      const { data: publicData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      if (publicData?.publicUrl) {
        setValue("avatarUrl", publicData.publicUrl, { shouldDirty: true });
      }
    } catch (err: any) {
      setUploadError("Erreur lors du téléversement. Réessayez.");
    } finally {
      setUploadingPhoto(false);
      // Reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function onSubmit(data: ProfileFormData) {
    setServerError(null);
    setSuccess(false);
    const supabase = createClient();

    const avatarToSave = data.avatarUrl?.trim() || getAvatarUrl(null, data.fullName);

    const { error } = await supabase
      .from("profiles")
      .update({
        name: data.fullName,
        phone: data.phone || null,
        avatarUrl: avatarToSave,
      })
      .eq("id", profile.id);

    if (error) {
      setServerError("Erreur lors de la mise à jour. Veuillez réessayer.");
      return;
    }

    setSuccess(true);
    router.refresh();
  }

  const displayAvatar = getAvatarUrl(watchedAvatar, watchedName || currentName);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {serverError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle className="h-4 w-4 shrink-0" />
          Profil mis à jour avec succès !
        </div>
      )}

      {/* ============================================================
          PHOTO DE PROFIL — Section complète avec upload fichier
         ============================================================ */}
      <div className="rounded-2xl border border-neutral-200 bg-neutral-50/50 p-5 space-y-5">
        <label className="block text-sm font-semibold text-neutral-800">
          Photo de profil
        </label>

        {/* Avatar preview + bouton upload */}
        <div className="flex items-center gap-5">
          {/* Avatar preview circle */}
          <div className="relative h-24 w-24 shrink-0 group">
            <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-white shadow-lg bg-neutral-100">
              <img
                src={displayAvatar}
                alt="Photo de profil"
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getAvatarUrl(null, watchedName || currentName);
                }}
              />
            </div>
            {/* Overlay bouton caméra */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Changer la photo"
            >
              {uploadingPhoto ? (
                <Loader2 className="h-5 w-5 text-white animate-spin" />
              ) : (
                <Camera className="h-5 w-5 text-white" />
              )}
            </button>
          </div>

          {/* Actions */}
          <div className="flex-1 space-y-3">
            {/* Upload depuis fichier — bouton principal */}
            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="flex items-center gap-2 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition-all hover:border-blue-400 hover:bg-blue-100 disabled:opacity-50"
              >
                {uploadingPhoto ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Téléversement...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Télécharger depuis mon appareil
                  </>
                )}
              </button>
              <p className="mt-1 text-xs text-neutral-500">
                JPG, PNG, WEBP, GIF — Max 5 Mo
              </p>
            </div>

            {/* Input fichier caché */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/heic"
              onChange={handleFileUpload}
              className="hidden"
              aria-label="Choisir une photo de profil"
            />

            {uploadError && (
              <p className="flex items-center gap-1.5 text-xs font-medium text-orange-600">
                <X className="h-3.5 w-3.5" /> {uploadError}
              </p>
            )}

            {/* Avatars prédéfinis */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-neutral-500">Ou choisir :</span>
              {PRESET_AVATARS.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setValue("avatarUrl", url, { shouldDirty: true })}
                  className="relative h-9 w-9 overflow-hidden rounded-full border-2 border-transparent transition-all hover:scale-110 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <img src={url} alt={`Avatar ${idx + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
              <button
                type="button"
                onClick={() => setValue("avatarUrl", getAvatarUrl(null, watchedName), { shouldDirty: true })}
                className="flex items-center gap-1 rounded-full border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100"
              >
                <Sparkles className="h-3 w-3" /> Initiales
              </button>
            </div>
          </div>
        </div>

        {/* Champ URL manuelle en repli */}
        <details className="group">
          <summary className="cursor-pointer text-xs font-medium text-neutral-500 hover:text-neutral-700 select-none">
            Ou saisir une URL d&apos;image directement ▸
          </summary>
          <div className="mt-2">
            <input
              id="avatar-url-input"
              type="text"
              placeholder="https://exemple.com/photo.jpg"
              {...register("avatarUrl")}
              className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs text-neutral-700 transition-colors focus:border-blue-500 focus:outline-none"
            />
          </div>
        </details>
      </div>

      {/* Nom complet */}
      <div>
        <label htmlFor="profile-name" className="mb-1.5 block text-sm font-medium text-neutral-700">
          Nom complet
        </label>
        <input
          id="profile-name"
          type="text"
          {...register("fullName")}
          className="w-full rounded-xl border border-[var(--border)] bg-neutral-50 px-4 py-3 text-sm transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        {errors.fullName && (
          <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>
        )}
      </div>

      {/* Téléphone */}
      <div>
        <label htmlFor="profile-phone" className="mb-1.5 block text-sm font-medium text-neutral-700">
          Téléphone
        </label>
        <input
          id="profile-phone"
          type="tel"
          {...register("phone")}
          className="w-full rounded-xl border border-[var(--border)] bg-neutral-50 px-4 py-3 text-sm transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        {errors.phone && (
          <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>
        )}
      </div>

      {/* Email (lecture seule) */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">Email</label>
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
        disabled={isSubmitting}
        className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Enregistrement...
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            Enregistrer les modifications
          </>
        )}
      </button>
    </form>
  );
}
