"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup } from "@/components/ui/radio";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast-notification";
import { Skeleton, PropertyCardSkeleton, TableSkeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { ImageUploader } from "@/components/ui/image-uploader";
import {
  Search,
  Mail,
  Lock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldCheck,
  Building2,
  Sparkles,
} from "lucide-react";

export default function DesignSystemDemoPage() {
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSize, setModalSize] = useState<"sm" | "md" | "lg" | "xl">("md");

  // Form states
  const [inputValue, setInputValue] = useState("");
  const [inputError, setInputError] = useState(false);
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const [radioValue, setRadioValue] = useState("RENT");

  return (
    <div className="min-h-screen bg-[var(--color-bg)] p-6 md:p-12 space-y-16 max-w-6xl mx-auto text-left">
      {/* Header Banner */}
      <div className="rounded-3xl border border-[var(--color-border)] bg-gradient-to-r from-blue-50 via-white to-blue-50/30 p-8 shadow-sm">
        <div className="flex items-center gap-3 text-[var(--color-primary)] mb-2">
          <Sparkles className="h-6 w-6" />
          <span className="text-xs font-bold uppercase tracking-wider">Ma Maison — Sprint 2</span>
        </div>
        <h1 className="text-h1 text-[var(--color-text)]">Design System — Galerie de validation</h1>
        <p className="mt-2 text-neutral-600 max-w-2xl">
          Page temporaire de validation visuelle (`/dev/design-system`). Tous les composants partagés respectent la Partie 8 du Master Prompt v1.1.
        </p>
      </div>

      {/* 1. TYPOGRAPHY SCALE */}
      <section className="space-y-6">
        <div className="border-b border-[var(--color-border)] pb-3">
          <h2 className="text-h2">1. Échelle Typographique</h2>
          <p className="text-xs text-neutral-500 mt-1">Police Geist configurée, tailles strictes H1 à small.</p>
        </div>

        <div className="space-y-4 rounded-2xl border border-[var(--color-border)] p-6 bg-white shadow-sm">
          <div>
            <span className="text-xs font-mono text-neutral-400">H1 — 36px (bold)</span>
            <h1 className="text-h1">Consultez les annonces immobilières au Niger</h1>
          </div>
          <div>
            <span className="text-xs font-mono text-neutral-400">H2 — 30px (bold)</span>
            <h2 className="text-h2">Trouvez votre futur appartement à Niamey</h2>
          </div>
          <div>
            <span className="text-xs font-mono text-neutral-400">H3 — 24px (semibold)</span>
            <h3 className="text-h3">Abonnement Propriétaire & Gestion des annonces</h3>
          </div>
          <div>
            <span className="text-xs font-mono text-neutral-400">H4 — 20px (semibold)</span>
            <h4 className="text-h4">Détails du paiement par Wave ou Amanata</h4>
          </div>
          <div>
            <span className="text-xs font-mono text-neutral-400">Body / Text — 16px (normal)</span>
            <p className="text-body">
              Ma Maison est la plateforme immobilière de référence au Niger, permettant de rapprocher locataires, propriétaires et agences certifiées.
            </p>
          </div>
          <div>
            <span className="text-xs font-mono text-neutral-400">Small Text — 14px (medium)</span>
            <p className="text-small text-neutral-500">
              * Les frais de publication s'élèvent à 1 500 FCFA par mois avec 30 jours d'essai gratuit.
            </p>
          </div>
        </div>
      </section>

      {/* 2. COLOR TOKENS */}
      <section className="space-y-6">
        <div className="border-b border-[var(--color-border)] pb-3">
          <h2 className="text-h2">2. Tokens de Couleur CSS</h2>
          <p className="text-xs text-neutral-500 mt-1">Variables CSS réutilisables (`--color-*`). Aucune valeur hex en dur.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
          <div className="rounded-2xl border border-[var(--color-border)] p-4 text-center space-y-2 bg-white shadow-xs">
            <div className="h-12 w-full rounded-xl bg-[var(--color-primary)]" />
            <p className="text-xs font-bold">Primary</p>
            <p className="text-[10px] font-mono text-neutral-500">#2563EB</p>
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] p-4 text-center space-y-2 bg-white shadow-xs">
            <div className="h-12 w-full rounded-xl bg-[var(--color-success)]" />
            <p className="text-xs font-bold">Success</p>
            <p className="text-[10px] font-mono text-neutral-500">#16A34A</p>
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] p-4 text-center space-y-2 bg-white shadow-xs">
            <div className="h-12 w-full rounded-xl bg-[var(--color-warning)]" />
            <p className="text-xs font-bold">Warning</p>
            <p className="text-[10px] font-mono text-neutral-500">#EA580C</p>
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] p-4 text-center space-y-2 bg-white shadow-xs">
            <div className="h-12 w-full rounded-xl bg-[var(--color-danger)]" />
            <p className="text-xs font-bold">Danger</p>
            <p className="text-[10px] font-mono text-neutral-500">#DC2626</p>
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] p-4 text-center space-y-2 bg-white shadow-xs">
            <div className="h-12 w-full rounded-xl bg-[var(--color-bg)] border border-neutral-300" />
            <p className="text-xs font-bold">Background</p>
            <p className="text-[10px] font-mono text-neutral-500">#FFFFFF</p>
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] p-4 text-center space-y-2 bg-white shadow-xs">
            <div className="h-12 w-full rounded-xl bg-[var(--color-text)]" />
            <p className="text-xs font-bold">Text</p>
            <p className="text-[10px] font-mono text-neutral-500">#111827</p>
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] p-4 text-center space-y-2 bg-white shadow-xs">
            <div className="h-12 w-full rounded-xl bg-[var(--color-muted)] border border-neutral-200" />
            <p className="text-xs font-bold">Muted</p>
            <p className="text-[10px] font-mono text-neutral-500">#F3F4F6</p>
          </div>
        </div>
      </section>

      {/* 3. BUTTON VARIANTS */}
      <section className="space-y-6">
        <div className="border-b border-[var(--color-border)] pb-3">
          <h2 className="text-h2">3. Boutons (4 variantes strictes)</h2>
          <p className="text-xs text-neutral-500 mt-1">
            Primary (bleu), Secondary (neutre gris — jamais vert success), Outline, Danger (rouge).
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] p-6 bg-white space-y-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
              Primary (Bleu)
            </Button>
            <Button variant="secondary" leftIcon={<Building2 className="h-4 w-4" />}>
              Secondary (Neutre)
            </Button>
            <Button variant="outline">
              Outline
            </Button>
            <Button variant="danger" leftIcon={<Trash2 className="h-4 w-4" />}>
              Danger (Rouge)
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-neutral-400">Tailles (sm, md, lg)</p>
            <div className="flex flex-wrap items-center gap-4">
              <Button variant="primary" size="sm">Small (sm)</Button>
              <Button variant="primary" size="md">Medium (md)</Button>
              <Button variant="primary" size="lg">Large (lg)</Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-neutral-400">États (Chargement, Désactivé)</p>
            <div className="flex flex-wrap items-center gap-4">
              <Button variant="primary" isLoading>En cours...</Button>
              <Button variant="secondary" disabled>Désactivé</Button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FORM CONTROLS */}
      <section className="space-y-6">
        <div className="border-b border-[var(--color-border)] pb-3">
          <h2 className="text-h2">4. Contrôles de Formulaire</h2>
          <p className="text-xs text-neutral-500 mt-1">Input, Textarea, Select, Checkbox, Radio Group avec labels et gestion d'erreurs.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 rounded-2xl border border-[var(--color-border)] p-6 bg-white shadow-sm">
          <Input
            label="Nom complet *"
            placeholder="Ex: Amadou Seydou"
            leftIcon={<Mail className="h-4 w-4" />}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            error={inputError ? "Le champ est obligatoire" : undefined}
            helperText="Entrez votre nom tel qu'il apparaît sur votre pièce d'identité."
          />

          <Input
            label="Mot de passe *"
            type="password"
            placeholder="••••••••"
            leftIcon={<Lock className="h-4 w-4" />}
            helperText="Au moins 8 caractères."
          />

          <Select
            label="Ville *"
            options={[
              { value: "Niamey", label: "Niamey" },
              { value: "Zinder", label: "Zinder" },
              { value: "Maradi", label: "Maradi" },
              { value: "Agadez", label: "Agadez" },
            ]}
            helperText="Sélectionnez la ville de votre bien."
          />

          <RadioGroup
            name="transaction"
            label="Type de transaction *"
            selectedValue={radioValue}
            onChange={(val) => setRadioValue(val)}
            options={[
              { value: "RENT", label: "Location", description: "Loyer mensuel en FCFA" },
              { value: "SALE", label: "Vente", description: "Prix total d'achat" },
            ]}
          />

          <div className="md:col-span-2">
            <Textarea
              label="Description complète du bien *"
              placeholder="Décrivez les atouts de votre logement..."
              helperText="Maximum 5 000 caractères."
            />
          </div>

          <div className="md:col-span-2 space-y-4">
            <Checkbox
              checked={checkboxChecked}
              onChange={(e) => setCheckboxChecked(e.target.checked)}
              label="J'accepte les conditions générales d'utilisation"
              description="Conformément à la politique de confidentialité de Ma Maison."
            />

            <Button
              variant="outline"
              size="sm"
              onClick={() => setInputError(!inputError)}
            >
              Basculer l'état d'erreur du champ Nom
            </Button>
          </div>
        </div>
      </section>

      {/* 5. BADGES */}
      <section className="space-y-6">
        <div className="border-b border-[var(--color-border)] pb-3">
          <h2 className="text-h2">5. Badges (Mapping Enum Partie 8)</h2>
          <p className="text-xs text-neutral-500 mt-1">
            Verified/Agency, Pending, Approved, Rejected, Expired, Draft, Hidden, Nouveau (&lt; 7 jours).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--color-border)] p-6 bg-white shadow-sm">
          <Badge variant="verified" />
          <Badge variant="agency" />
          <Badge variant="approved" />
          <Badge variant="pending" />
          <Badge variant="rejected" />
          <Badge variant="expired" />
          <Badge variant="draft" />
          <Badge variant="hidden" />
          <Badge variant="new" />
        </div>
      </section>

      {/* 6. TOAST SYSTEM */}
      <section className="space-y-6">
        <div className="border-b border-[var(--color-border)] pb-3">
          <h2 className="text-h2">6. Système de Toast (4 types)</h2>
          <p className="text-xs text-neutral-500 mt-1">Notifications globales : Succès, Erreur, Info, Avertissement.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-[var(--color-border)] p-6 bg-white shadow-sm">
          <Button
            variant="primary"
            onClick={() => toast.success("Paiement validé avec succès !")}
          >
            Toast Succès
          </Button>

          <Button
            variant="danger"
            onClick={() => toast.error("Erreur lors de la mise à jour du profil.")}
          >
            Toast Erreur
          </Button>

          <Button
            variant="secondary"
            onClick={() => toast.info("Un e-mail de confirmation vous a été envoyé.")}
          >
            Toast Info
          </Button>

          <Button
            variant="outline"
            onClick={() => toast.warning("Votre période d'essai expire dans 3 jours.")}
          >
            Toast Avertissement
          </Button>
        </div>
      </section>

      {/* 7. MODAL */}
      <section className="space-y-6">
        <div className="border-b border-[var(--color-border)] pb-3">
          <h2 className="text-h2">7. Modales (Sans window.confirm)</h2>
          <p className="text-xs text-neutral-500 mt-1">Modale accessible avec backdrop blur, touche ESC, tailles réactivables.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-[var(--color-border)] p-6 bg-white shadow-sm">
          {(["sm", "md", "lg", "xl"] as const).map((size) => (
            <Button
              key={size}
              variant="outline"
              onClick={() => {
                setModalSize(size);
                setModalOpen(true);
              }}
            >
              Ouvrir Modale ({size.toUpperCase()})
            </Button>
          ))}
        </div>

        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          size={modalSize}
          title="Validation de l'action"
          description="Cette modale remplace window.confirm() dans toute l'application."
          footer={
            <>
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setModalOpen(false);
                  toast.success("Action confirmée !");
                }}
              >
                Confirmer l'action
              </Button>
            </>
          }
        >
          <div className="space-y-3">
            <p>
              Êtes-vous sûr de vouloir poursuivre cette opération ? Toutes les données seront sauvegardées conformément à votre configuration.
            </p>
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800">
              ℹ️ Taille sélectionnée : <span className="font-bold uppercase">{modalSize}</span>.
            </div>
          </div>
        </Modal>
      </section>

      {/* 8. SKELETONS & STATES */}
      <section className="space-y-6">
        <div className="border-b border-[var(--color-border)] pb-3">
          <h2 className="text-h2">8. Skeletons, ErrorState & EmptyState</h2>
          <p className="text-xs text-neutral-500 mt-1">Composants de chargement, d'erreur et de liste vide.</p>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PropertyCardSkeleton />
            <PropertyCardSkeleton />
            <PropertyCardSkeleton />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ErrorState
              title="Erreur de connexion serveur"
              message="Impossible de contacter le service de paiement. Veuillez réessayer dans un instant."
              onRetry={() => toast.info("Tentative de reconnexion...")}
            />

            <EmptyState
              title="Aucune annonce trouvée"
              description="Vous n'avez pas encore publié d'annonce immobilière."
              actionText="Publier une annonce"
              onAction={() => toast.success("Redirection vers la création d'annonce...")}
            />
          </div>
        </div>
      </section>

      {/* 9. IMAGE UPLOADER */}
      <section className="space-y-6">
        <div className="border-b border-[var(--color-border)] pb-3">
          <h2 className="text-h2">9. Image Uploader avec compression WebP</h2>
          <p className="text-xs text-neutral-500 mt-1">Compression HTML5 Canvas côté client (max 1600px, WebP 80% qualité).</p>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] p-6 bg-white shadow-sm">
          <ImageUploader
            maxFiles={5}
            maxSizeMB={5}
            onImagesCompressed={(files) => {
              toast.success(`${files.length} photo(s) optimisée(s) en WebP !`);
            }}
          />
        </div>
      </section>
    </div>
  );
}
