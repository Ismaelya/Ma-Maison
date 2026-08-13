"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";

interface DeletePropertyButtonProps {
  propertyId: string;
  propertyTitle?: string;
  redirectOnDelete?: string;
  variant?: "icon" | "button";
}

export function DeletePropertyButton({
  propertyId,
  propertyTitle,
  redirectOnDelete,
  variant = "icon",
}: DeletePropertyButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/properties/${propertyId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error?.message || data.message || "Erreur lors de la suppression"
        );
      }
      setIsOpen(false);
      if (redirectOnDelete) {
        router.push(redirectOnDelete);
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Impossible de supprimer cette annonce");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
          title="Supprimer"
          aria-label="Supprimer l'annonce"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          Supprimer l&apos;annonce
        </button>
      )}

      <Modal
        isOpen={isOpen}
        onClose={() => {
          if (!isDeleting) setIsOpen(false);
        }}
        title="Supprimer l'annonce"
        description={propertyTitle ? `Annonce : ${propertyTitle}` : undefined}
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              disabled={isDeleting}
              className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Supprimer
            </button>
          </>
        }
      >
        <div className="space-y-3 text-left">
          <p className="text-sm text-neutral-600">
            Êtes-vous sûr de vouloir supprimer cette annonce ? Cette action est irréversible.
          </p>
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
              {error}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
