// ============================================================
// MA MAISON — Types centralisés
// Source de vérité : schema.prisma → @prisma/client
// Ne jamais redéfinir manuellement les types générés par Prisma.
// ============================================================

// --- Re-export des types Prisma (modèles) ---
export type {
  Profile,
  Property,
  PropertyImage,
  Favorite,
  Subscription,
  Payment,
  Conversation,
  Message,
  Review,
  Report,
  AuditLog,
  AppSettings,
} from "@prisma/client";

// --- Re-export des enums Prisma ---
export {
  UserRole,
  AccountStatus,
  SubscriptionStatus,
  PaymentStatus,
  PaymentMethod,
  PropertyStatus,
  PropertyType,
  TransactionType,
  RentalPeriod,
  ReportStatus,
  AuditAction,
} from "@prisma/client";

// --- Import pour construire les types composites ---
import type {
  Profile,
  Property,
  PropertyImage,
  Payment,
} from "@prisma/client";

// --- Types composites (non générés par Prisma) ---

/** Annonce avec profil du propriétaire attaché (requête Supabase jointure) */
export type PropertyWithOwner = Property & {
  profiles: Pick<
    Profile,
    "id" | "name" | "avatarUrl" | "phone" | "badgeVerified" | "status"
  >;
  property_images?: PropertyImage[];
};

/** Paiement avec profil du propriétaire attaché */
export type PaymentWithOwner = Payment & {
  profiles: Pick<Profile, "id" | "name" | "email" | "phone">;
};

// --- Alias legacy ---
/** @deprecated Utiliser Property */
export type Listing = Property;
/** @deprecated Utiliser PropertyWithOwner */
export type ListingWithOwner = PropertyWithOwner;

/** Insert types for forms */
export type { Prisma } from "@prisma/client";
