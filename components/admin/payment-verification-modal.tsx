"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, FileText, Loader2, Eye, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice, formatDate } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";

type PaymentVerificationModalProps = {
  payment: any;
};

export function PaymentVerificationModal({
  payment,
}: PaymentVerificationModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject" | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const receiptPath = payment.receiptUrl || payment.receipt_url;

  async function openModal() {
    setIsOpen(true);

    // Get signed URL for private receipt in receipts or payment-receipts bucket
    if (receiptPath) {
      // Try payment-receipts bucket first, fallback to receipts
      let { data } = await supabase.storage
        .from("payment-receipts")
        .createSignedUrl(receiptPath, 3600);

      if (!data?.signedUrl) {
        const fallback = await supabase.storage
          .from("receipts")
          .createSignedUrl(receiptPath, 3600);
        data = fallback.data;
      }

      if (data?.signedUrl) {
        setSignedUrl(data.signedUrl);
      }
    }
  }

  async function executeApprove() {
    setIsLoading(true);

    try {
      // API call ONLY updates payment.status = APPROVED. Postgres trigger handles atomic subscription activation.
      const res = await fetch(`/api/admin/payments/${payment.id}/approve`, {
        method: "PATCH",
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Erreur de validation");
      }

      setConfirmAction(null);
      setIsOpen(false);
      router.refresh();
    } catch (err: any) {
      alert("Erreur lors de la validation : " + err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function executeReject() {
    setIsLoading(true);

    try {
      const res = await fetch(`/api/admin/payments/${payment.id}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: adminNotes || "Reçu de paiement invalide" }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Erreur de refus");
      }

      setConfirmAction(null);
      setIsOpen(false);
      router.refresh();
    } catch (err: any) {
      alert("Erreur lors du refus : " + err.message);
    } finally {
      setIsLoading(false);
    }
  }

  const profile = payment.user || payment.profiles || {};
  const statusStr = String(payment.status || "PENDING").toUpperCase();

  return (
    <>
      <button
        onClick={openModal}
        className="flex items-center gap-1 rounded-lg bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-neutral-200 transition-colors hover:bg-neutral-700"
      >
        <Eye className="h-3.5 w-3.5 text-yellow-400" />
        Vérifier le reçu
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in text-left">
          <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-neutral-950 border border-neutral-800 text-neutral-100 shadow-2xl animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
              <h3 className="text-lg font-bold text-white">
                Vérification du reçu — {(payment.method || payment.provider || "wave").toUpperCase()} ({formatPrice(payment.amount)})
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Owner details */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
                <p className="text-xs font-semibold uppercase text-neutral-400">Propriétaire</p>
                <p className="font-bold text-white mt-1">{profile.name || "Sans nom"}</p>
                <p className="text-xs text-neutral-400">{profile.email} · {profile.phone || "Pas de téléphone"}</p>
                <p className="mt-2 text-xs text-neutral-500">Demande créée le {formatDate(payment.createdAt || payment.created_at)}</p>
              </div>

              {/* Receipt Preview */}
              <div>
                <p className="text-xs font-semibold uppercase text-neutral-400 mb-2">Reçu fourni</p>
                <div className="flex min-h-[250px] items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
                  {signedUrl ? (
                    signedUrl.endsWith(".pdf") ? (
                      <a
                        href={signedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 rounded-xl bg-neutral-800 px-4 py-3 text-sm font-semibold text-white hover:bg-neutral-700"
                      >
                        <FileText className="h-5 w-5" />
                        Ouvrir le document PDF
                      </a>
                    ) : (
                      <img
                        src={signedUrl}
                        alt="Reçu de paiement"
                        className="max-h-[350px] w-auto rounded-xl object-contain shadow-lg"
                      />
                    )
                  ) : (
                    <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
                  )}
                </div>
              </div>

              {/* Admin notes input */}
              {statusStr === "PENDING" && (
                <div>
                  <label htmlFor={`admin-notes-${payment.id}`} className="block text-xs font-semibold uppercase text-neutral-400 mb-1">
                    Note administrative / Motif de refus (facultatif)
                  </label>
                  <input
                    id={`admin-notes-${payment.id}`}
                    type="text"
                    placeholder="Ex: Reçu vérifié sur Wave / Motif de refus"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-primary-500 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Modal Actions */}
            {statusStr === "PENDING" ? (
              <div className="flex gap-3 border-t border-neutral-800 p-6 bg-neutral-900">
                <button
                  onClick={() => setConfirmAction("reject")}
                  disabled={isLoading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-800 bg-red-950 px-4 py-3 text-sm font-semibold text-red-400 hover:bg-red-900 disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" />
                  Refuser le paiement
                </button>
                <button
                  onClick={() => setConfirmAction("approve")}
                  disabled={isLoading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 shadow-md disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Valider l&apos;abonnement (+30j)
                </button>
              </div>
            ) : (
              <div className="border-t border-neutral-800 p-4 bg-neutral-900 text-center text-xs text-neutral-400">
                Demande déjà traitée ({statusStr})
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal - Approve */}
      <Modal
        isOpen={confirmAction === "approve"}
        onClose={() => setConfirmAction(null)}
        title="Confirmer la validation du paiement"
        description="L'abonnement du propriétaire sera automatiquement activé pour 30 jours."
        footer={
          <>
            <button
              onClick={() => setConfirmAction(null)}
              className="rounded-xl border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 hover:bg-neutral-800"
            >
              Annuler
            </button>
            <button
              onClick={executeApprove}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 shadow-md disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Confirmer la validation (+30j)
            </button>
          </>
        }
      >
        <p className="text-sm text-neutral-300">
          Êtes-vous sûr de vouloir valider ce paiement de <strong>{formatPrice(payment.amount)}</strong> pour <strong>{profile.name || profile.email}</strong> ?
        </p>
      </Modal>

      {/* Confirmation Modal - Reject */}
      <Modal
        isOpen={confirmAction === "reject"}
        onClose={() => setConfirmAction(null)}
        title="Confirmer le refus du paiement"
        description="Le paiement sera marqué comme refusé et le propriétaire sera notifié."
        footer={
          <>
            <button
              onClick={() => setConfirmAction(null)}
              className="rounded-xl border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 hover:bg-neutral-800"
            >
              Annuler
            </button>
            <button
              onClick={executeReject}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-xl border border-red-800 bg-red-950 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-900 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Confirmer le refus
            </button>
          </>
        }
      >
        <p className="text-sm text-neutral-300">
          Motif du refus : <strong>{adminNotes || "Reçu de paiement invalide"}</strong>
        </p>
      </Modal>
    </>
  );
}
