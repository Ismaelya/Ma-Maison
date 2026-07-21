import type { Database } from "./database";

// Profile types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

// Property types (formerly Listing)
export type Property = Database["public"]["Tables"]["properties"]["Row"];
export type PropertyInsert = Database["public"]["Tables"]["properties"]["Insert"];
export type PropertyUpdate = Database["public"]["Tables"]["properties"]["Update"];

// Property Image type
export type PropertyImage = Database["public"]["Tables"]["property_images"]["Row"];

// Favorite types
export type Favorite = Database["public"]["Tables"]["favorites"]["Row"];
export type FavoriteInsert = Database["public"]["Tables"]["favorites"]["Insert"];

// Messaging & Conversation types
export type Conversation = Database["public"]["Tables"]["conversations"]["Row"];
export type Message = Database["public"]["Tables"]["conversation_messages"]["Row"];
export type MessageInsert = Database["public"]["Tables"]["conversation_messages"]["Insert"];

// Subscription & Payment types
export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];
export type Payment = Database["public"]["Tables"]["payments"]["Row"];
export type PaymentInsert = Database["public"]["Tables"]["payments"]["Insert"];
export type PaymentUpdate = Database["public"]["Tables"]["payments"]["Update"];

// Review & Report & Audit types
export type Review = Database["public"]["Tables"]["reviews"]["Row"];
export type Report = Database["public"]["Tables"]["property_reports"]["Row"];
export type AuditLog = {
  id: string;
  actor_id: string | null;
  action: AuditAction;
  target_id: string | null;
  metadata?: any;
  created_at: string;
};

// Enum types
export type TransactionType = "rent" | "sale";
export type UserRole = "TENANT" | "OWNER" | "AGENCY" | "ADMIN" | "tenant" | "owner" | "agency" | "admin";
export type AccountStatus = "ACTIVE" | "SUSPENDED" | "DELETED" | "active" | "suspended" | "deleted";
export type SubscriptionStatus = "TRIAL" | "ACTIVE" | "EXPIRED" | "trial" | "active" | "expired";
export type PropertyType = "HOUSE" | "APARTMENT" | "ROOM" | "VILLA" | "OFFICE" | "SHOP" | "LAND" | "apartment" | "house" | "studio" | "land" | "commercial";
export type PropertyStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "HIDDEN" | "DELETED";
export type PaymentStatus = "PENDING" | "APPROVED" | "REJECTED" | "pending" | "approved" | "rejected";
export type PaymentMethod = "AMANATA" | "MYNITA" | "WAVE" | "wave" | "amanata" | "mynita";
export type ReportStatus = "OPEN" | "IN_REVIEW" | "CLOSED" | "pending" | "resolved" | "dismissed";
export type AuditAction =
  | "LOGIN"
  | "PAYMENT_APPROVED"
  | "PAYMENT_REJECTED"
  | "PROPERTY_DELETED"
  | "PROPERTY_APPROVED"
  | "PROPERTY_REJECTED"
  | "ACCOUNT_SUSPENDED"
  | "ADMIN_ACTION";

// Property with owner profile attached
export type PropertyWithOwner = Property & {
  profiles: Pick<Profile, "id" | "name" | "full_name" | "avatar_url" | "phone" | "badge_verified" | "account_status" | "subscription_status">;
  property_images?: PropertyImage[];
};

// Legacy alias for smooth backwards compatibility
export type Listing = Property;
export type ListingWithOwner = PropertyWithOwner;

// Payment with owner profile attached
export type PaymentWithOwner = Payment & {
  profiles: Pick<Profile, "id" | "name" | "full_name" | "email" | "phone">;
};
