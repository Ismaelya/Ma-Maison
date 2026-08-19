import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind classes intelligently — handles conflicts and conditional classes.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a price in FCFA with proper formatting.
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("fr-NE", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(price) + " FCFA";
}

/**
 * Maps rental period enum to its French price suffix (e.g. "/mois").
 */
export function getRentalPeriodSuffix(rentalPeriod: string | null | undefined): string {
  const suffixes: Record<string, string> = {
    DAILY: "/jour",
    MONTHLY: "/mois",
    YEARLY: "/an",
    daily: "/jour",
    monthly: "/mois",
    yearly: "/an",
  };
  return rentalPeriod ? (suffixes[rentalPeriod] ?? "") : "";
}

/**
 * Maps rental period enum to French label.
 */
export function getRentalPeriodLabel(rentalPeriod: string | null | undefined): string {
  const labels: Record<string, string> = {
    DAILY: "Journalière",
    MONTHLY: "Mensuelle",
    YEARLY: "Annuelle",
    daily: "Journalière",
    monthly: "Mensuelle",
    yearly: "Annuelle",
  };
  return rentalPeriod ? (labels[rentalPeriod] ?? rentalPeriod) : "";
}

/**
 * Formats a property's price for display, appending the rental period suffix
 * ("/mois", "/jour", "/an") when it's a rental — falls back to "/mois" for
 * legacy rentals created before rentalPeriod existed.
 */
export function formatPropertyPrice(
  price: number,
  transactionType: string | null | undefined,
  rentalPeriod?: string | null
): string {
  const isRent = String(transactionType ?? "RENT").toUpperCase() === "RENT";
  if (!isRent) return formatPrice(price);
  return formatPrice(price) + getRentalPeriodSuffix(rentalPeriod || "MONTHLY");
}

/**
 * Formats a date in French locale safely.
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "N/A";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "N/A";
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
  } catch {
    return "N/A";
  }
}

/**
 * Formats a relative time (e.g., "il y a 2 jours").
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const target =
    typeof date === "string"
      ? new Date(date.includes("Z") || date.includes("+") ? date : date + "Z")
      : new Date(date);
  const diffMs = now.getTime() - target.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 30) {
    return formatDate(date);
  }
  if (diffDays > 0) {
    return `il y a ${diffDays} jour${diffDays > 1 ? "s" : ""}`;
  }
  if (diffHours > 0) {
    return `il y a ${diffHours} heure${diffHours > 1 ? "s" : ""}`;
  }
  if (diffMinutes > 0) {
    return `il y a ${diffMinutes} minute${diffMinutes > 1 ? "s" : ""}`;
  }
  return "à l'instant";
}

/**
 * Maps transaction type enum to French label.
 */
export function getTransactionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    RENT: "Location",
    SALE: "Vente",
    rent: "Location",
    sale: "Vente",
  };
  return labels[type] ?? type;
}

/**
 * Maps property type enum to French label (supports both uppercase and lowercase enums).
 */
export function getPropertyTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    HOUSE: "Maison",
    APARTMENT: "Appartement",
    ROOM: "Chambre / Studio",
    VILLA: "Villa",
    OFFICE: "Bureau",
    SHOP: "Boutique / Local commercial",
    LAND: "Terrain",
    RESIDENCE: "Résidence",
    apartment: "Appartement",
    house: "Maison",
    studio: "Studio",
    land: "Terrain",
    commercial: "Local commercial",
  };
  return labels[type] ?? type;
}

/**
 * Maps property status enum to French label.
 */
export function getPropertyStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    DRAFT: "Brouillon",
    PENDING: "En attente",
    APPROVED: "Approuvée",
    REJECTED: "Refusée",
    HIDDEN: "Masquée",
    DELETED: "Supprimée",
  };
  return labels[status] ?? status;
}

/**
 * Maps user role enum to French label.
 */
export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    TENANT: "Locataire",
    OWNER: "Propriétaire",
    AGENCY: "Agence immobilière",
    ADMIN: "Administrateur",
    tenant: "Locataire",
    owner: "Propriétaire",
    agency: "Agence immobilière",
    admin: "Administrateur",
  };
  return labels[role] ?? role;
}

/**
 * Truncates text to a maximum length with ellipsis.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "…";
}

/**
 * Returns the remaining trial days for an owner.
 */
export function getTrialDaysRemaining(trialStartedAt: string | null): number {
  if (!trialStartedAt) return 0;
  const start = new Date(trialStartedAt);
  const expiry = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const remaining = Math.ceil(
    (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.max(0, remaining);
}

/**
 * Returns a valid profile avatar URL. If avatarUrl is missing, generates a high quality avatar based on user name.
 */
export function getAvatarUrl(avatarUrl: string | null | undefined, name: string | null | undefined): string {
  if (avatarUrl && avatarUrl.trim().length > 0) {
    return avatarUrl;
  }
  const cleanName = (name || "Utilisateur").trim();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=2563eb&color=ffffff&bold=true&size=256`;
}

/**
 * Translates Supabase auth error messages into friendly French text.
 */
export function formatAuthError(errorMsg?: string | null): string {
  if (!errorMsg) return "Une erreur est survenue.";
  const lower = errorMsg.toLowerCase();

  if (lower.includes("email rate limit exceeded") || lower.includes("rate limit") || lower.includes("too many requests")) {
    return "Trop d'e-mails envoyés en peu de temps (limite de sécurité atteinte). Veuillez patienter quelques minutes avant de réessayer.";
  }
  if (lower.includes("invalid login credentials") || lower.includes("invalid credentials")) {
    return "Adresse e-mail ou mot de passe incorrect.";
  }
  if (lower.includes("user already registered") || lower.includes("already exists")) {
    return "Un compte existe déjà avec cette adresse e-mail.";
  }
  if (lower.includes("email not confirmed")) {
    return "Veuillez confirmer votre adresse e-mail avant de vous connecter.";
  }

  return errorMsg;
}

/**
 * Returns time-of-day greeting in French:
 * 5h–12h : "Bonjour"
 * 12h–18h : "Bon après-midi"
 * 18h–5h : "Bonsoir"
 */
export function getGreeting(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) {
    return "Bonjour";
  }
  if (hour >= 12 && hour < 18) {
    return "Bon après-midi";
  }
  return "Bonsoir";
}

