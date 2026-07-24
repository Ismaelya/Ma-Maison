"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, UserPlus, LogIn, X, Phone, MessageSquare } from "lucide-react";

type ContactProtectionProps = {
  phone: string | null;
  ownerName: string;
  ownerId: string;
  listingId: string;
  isAuthenticated: boolean;
};

export function ContactProtection({
  phone,
  ownerName,
  ownerId,
  listingId,
  isAuthenticated,
}: ContactProtectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  const [isInitializing, setIsInitializing] = useState(false);

  async function handleStartChat() {
    if (isInitializing) return;
    setIsInitializing(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: listingId,
          ownerId,
        }),
      });

      const json = await res.json();
      if (json.success && json.data?.id) {
        window.location.href = `/dashboard/messages?conv=${json.data.id}`;
      } else {
        window.location.href = `/dashboard/messages`;
      }
    } catch {
      window.location.href = `/dashboard/messages`;
    } finally {
      setIsInitializing(false);
    }
  }

  if (isAuthenticated) {
    return (
      <div className="mt-6 space-y-3">
        <button
          onClick={handleStartChat}
          disabled={isInitializing}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-700 hover:shadow-md disabled:opacity-50"
        >
          <MessageSquare className="h-4 w-4" />
          {isInitializing ? "Ouverture de la discussion..." : "Envoyer un message"}
        </button>

        {phone ? (
          <a
            href={`tel:${phone}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-secondary-500 bg-secondary-50 px-4 py-3 text-sm font-semibold text-secondary-700 transition-colors hover:bg-secondary-100"
          >
            <Phone className="h-4 w-4" />
            {phone}
          </a>
        ) : (
          <p className="text-center text-xs text-neutral-400">
            Téléphone non renseigné
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="mt-6 space-y-3">
        <button
          onClick={() => setIsOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-700 hover:shadow-md"
        >
          <MessageSquare className="h-4 w-4" />
          Contacter le propriétaire
        </button>

        <button
          onClick={() => setIsOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-neutral-50 px-4 py-3 text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-100"
        >
          <Lock className="h-4 w-4 text-neutral-400" />
          +227 XX XX XX XX (Masqué)
        </button>
      </div>

      {/* Visitor conversion modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-scale-in">
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Content */}
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                <Lock className="h-7 w-7" />
              </div>

              <h3 className="text-xl font-bold text-neutral-900">
                Créez un compte gratuitement
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                Pour des raisons de sécurité et de confidentialité, vous devez être
                connecté pour afficher le numéro de {ownerName} et envoyer un message.
              </p>

              <div className="mt-6 flex flex-col gap-3">
                <Link
                  href="/inscription"
                  className="flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-700"
                >
                  <UserPlus className="h-4 w-4" />
                  S&apos;inscrire gratuitement
                </Link>

                <Link
                  href="/connexion"
                  className="flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-5 py-3 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
                >
                  <LogIn className="h-4 w-4" />
                  Se connecter
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
