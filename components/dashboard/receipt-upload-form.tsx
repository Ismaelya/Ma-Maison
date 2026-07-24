"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload, FileText, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function ReceiptUploadForm() {
  const [provider, setProvider] = useState<"wave" | "amanata" | "mynita">("wave");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > 5 * 1024 * 1024) {
      setError("Le fichier ne doit pas dépasser 5 Mo");
      return;
    }

    setFile(selected);
    setError(null);

    if (selected.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(selected);
    } else {
      setPreview(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Veuillez sélectionner un reçu de paiement");
      return;
    }

    setIsUploading(true);
    setError(null);
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Non authentifié");

      // Upload receipt to private bucket `payment-receipts` (fallback `receipts`)
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      let uploadRes = await supabase.storage
        .from("payment-receipts")
        .upload(filePath, file, { contentType: file.type });

      if (uploadRes.error) {
        uploadRes = await supabase.storage
          .from("receipts")
          .upload(filePath, file, { contentType: file.type });
      }

      if (uploadRes.error) throw uploadRes.error;

      // Submit payment request via API endpoint
      const res = await fetch("/api/subscription/payment-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: provider.toUpperCase(),
          receiptUrl: filePath,
          amount: 1500,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Erreur d'envoi du paiement");
      }

      setSuccess(true);
      setFile(null);
      setPreview(null);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de l'envoi");
    } finally {
      setIsUploading(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-bold text-green-900">Demande envoyée avec succès !</h3>
        <p className="mt-1 text-sm text-green-700">
          Un administrateur va vérifier votre reçu de paiement sous 24h. Vous recevrez la confirmation dès validation.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-4 rounded-xl bg-green-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-green-700"
        >
          Soumettre un autre reçu
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Provider selection */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-neutral-900">
          Moyen de paiement utilisé *
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: "wave", name: "Wave", color: "border-blue-500 bg-blue-50 text-blue-700" },
            { id: "amanata", name: "Amanata", color: "border-orange-500 bg-orange-50 text-orange-700" },
            { id: "mynita", name: "Mynita", color: "border-purple-500 bg-purple-50 text-purple-700" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setProvider(item.id as any)}
              className={`rounded-xl border-2 py-3 text-center font-bold text-sm transition-all ${
                provider === item.id
                  ? item.color
                  : "border-[var(--border)] bg-neutral-50 text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>

      {/* File upload */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-neutral-900">
          Reçu de paiement (Capture / Photo / PDF) *
        </label>

        {preview ? (
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-[var(--border)] bg-neutral-100">
            <img src={preview} alt="Reçu" className="h-full w-full object-contain" />
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setPreview(null);
              }}
              className="absolute right-2 top-2 rounded-lg bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm"
            >
              Changer
            </button>
          </div>
        ) : file ? (
          <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-neutral-50 p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-neutral-500" />
              <div>
                <p className="text-sm font-medium text-neutral-900">{file.name}</p>
                <p className="text-xs text-neutral-400">
                  {(file.size / 1024 / 1024).toFixed(2)} Mo
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="text-xs font-medium text-red-600 hover:text-red-700"
            >
              Supprimer
            </button>
          </div>
        ) : (
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-8 text-center transition-colors hover:border-primary-400 hover:bg-primary-50/30">
            <Upload className="h-8 w-8 text-neutral-400" />
            <p className="mt-2 text-sm font-medium text-neutral-700">
              Cliquez pour choisir votre reçu
            </p>
            <p className="mt-1 text-xs text-neutral-400">PNG, JPG, WEBP ou PDF (max. 5 Mo)</p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>
        )}
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={isUploading || !file}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Envoi en cours...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            Soumettre pour validation
          </>
        )}
      </button>
    </form>
  );
}
