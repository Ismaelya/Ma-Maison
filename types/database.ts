/**
 * Database types matching the Supabase schema v1.1 (Part 3 Architecture).
 */
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          full_name?: string | null;
          phone: string | null;
          avatar_url: string | null;
          city: string | null;
          district: string | null;
          role: "TENANT" | "OWNER" | "AGENCY" | "ADMIN" | "tenant" | "owner" | "agency" | "admin";
          account_status: "ACTIVE" | "SUSPENDED" | "DELETED" | "active" | "suspended" | "deleted";
          subscription_status: "TRIAL" | "ACTIVE" | "EXPIRED" | "trial" | "active" | "expired";
          badge_verified: boolean;
          email_verified: boolean;
          phone_verified: boolean;
          trial_started_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          city?: string | null;
          district?: string | null;
          role?: "TENANT" | "OWNER" | "AGENCY" | "ADMIN" | "tenant" | "owner" | "agency" | "admin";
          account_status?: "ACTIVE" | "SUSPENDED" | "DELETED" | "active" | "suspended" | "deleted";
          subscription_status?: "TRIAL" | "ACTIVE" | "EXPIRED" | "trial" | "active" | "expired";
          badge_verified?: boolean;
          email_verified?: boolean;
          phone_verified?: boolean;
          trial_started_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          city?: string | null;
          district?: string | null;
          role?: "TENANT" | "OWNER" | "AGENCY" | "ADMIN" | "tenant" | "owner" | "agency" | "admin";
          account_status?: "ACTIVE" | "SUSPENDED" | "DELETED" | "active" | "suspended" | "deleted";
          subscription_status?: "TRIAL" | "ACTIVE" | "EXPIRED" | "trial" | "active" | "expired";
          badge_verified?: boolean;
          email_verified?: boolean;
          phone_verified?: boolean;
          trial_started_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      properties: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          description: string;
          type: "HOUSE" | "APARTMENT" | "ROOM" | "VILLA" | "OFFICE" | "SHOP" | "LAND";
          price: number;
          city: string;
          district: string;
          address: string | null;
          latitude: number | null;
          longitude: number | null;
          rooms: number;
          bathrooms: number;
          surface: number | null;
          status: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "HIDDEN" | "DELETED" | "draft" | "pending" | "approved" | "rejected" | "hidden" | "deleted";
          is_featured: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          title: string;
          description: string;
          type: "HOUSE" | "APARTMENT" | "ROOM" | "VILLA" | "OFFICE" | "SHOP" | "LAND";
          price: number;
          city: string;
          district: string;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          rooms: number;
          bathrooms: number;
          surface?: number | null;
          status?: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "HIDDEN" | "DELETED" | "draft" | "pending" | "approved" | "rejected" | "hidden" | "deleted";
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          title?: string;
          description?: string;
          type?: "HOUSE" | "APARTMENT" | "ROOM" | "VILLA" | "OFFICE" | "SHOP" | "LAND";
          price?: number;
          city?: string;
          district?: string;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          rooms?: number;
          bathrooms?: number;
          surface?: number | null;
          status?: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "HIDDEN" | "DELETED" | "draft" | "pending" | "approved" | "rejected" | "hidden" | "deleted";
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      property_images: {
        Row: {
          id: string;
          property_id: string;
          url: string;
          order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          url: string;
          order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          url?: string;
          order?: number;
          created_at?: string;
        };
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          property_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          property_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          property_id?: string;
          created_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          owner_id?: string;
          status: "TRIAL" | "ACTIVE" | "EXPIRED" | "trial" | "active" | "expired";
          price: number;
          start_date: string;
          end_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          owner_id?: string;
          status: "TRIAL" | "ACTIVE" | "EXPIRED" | "trial" | "active" | "expired";
          price?: number;
          start_date: string;
          end_date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          owner_id?: string;
          status?: "TRIAL" | "ACTIVE" | "EXPIRED" | "trial" | "active" | "expired";
          price?: number;
          start_date?: string;
          end_date?: string;
          created_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          user_id: string;
          owner_id?: string;
          subscription_id: string | null;
          amount: number;
          method: "AMANATA" | "MYNITA" | "WAVE" | "wave" | "amanata" | "mynita";
          provider?: string;
          receipt_url: string | null;
          reference: string | null;
          status: "PENDING" | "APPROVED" | "REJECTED" | "pending" | "approved" | "rejected";
          validated_by: string | null;
          validated_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          owner_id?: string;
          subscription_id?: string | null;
          amount: number;
          method: "AMANATA" | "MYNITA" | "WAVE" | "wave" | "amanata" | "mynita";
          provider?: string;
          receipt_url?: string | null;
          reference?: string | null;
          status?: "PENDING" | "APPROVED" | "REJECTED" | "pending" | "approved" | "rejected";
          validated_by?: string | null;
          validated_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          owner_id?: string;
          subscription_id?: string | null;
          amount?: number;
          method?: "AMANATA" | "MYNITA" | "WAVE" | "wave" | "amanata" | "mynita";
          provider?: string;
          receipt_url?: string | null;
          reference?: string | null;
          status?: "PENDING" | "APPROVED" | "REJECTED" | "pending" | "approved" | "rejected";
          validated_by?: string | null;
          validated_at?: string | null;
          created_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          property_id: string;
          tenant_id: string;
          owner_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          tenant_id: string;
          owner_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          tenant_id?: string;
          owner_id?: string;
          created_at?: string;
        };
      };
      conversation_messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          content?: string;
          is_read?: boolean;
          created_at?: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          property_id: string;
          author_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          author_id: string;
          rating: number;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          author_id?: string;
          rating?: number;
          comment?: string | null;
          created_at?: string;
        };
      };
      property_reports: {
        Row: {
          id: string;
          property_id: string;
          user_id: string;
          reason: string;
          status: "OPEN" | "IN_REVIEW" | "CLOSED";
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          user_id: string;
          reason: string;
          status?: "OPEN" | "IN_REVIEW" | "CLOSED";
          created_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          user_id?: string;
          reason?: string;
          status?: "OPEN" | "IN_REVIEW" | "CLOSED";
          created_at?: string;
        };
      };
    };
    Enums: {
      user_role_v3: "TENANT" | "OWNER" | "ADMIN";
      account_status_v3: "ACTIVE" | "SUSPENDED" | "DELETED";
      subscription_status_v3: "TRIAL" | "ACTIVE" | "EXPIRED";
      payment_status_v3: "PENDING" | "APPROVED" | "REJECTED";
      payment_method_v3: "AMANATA" | "MYNITA" | "WAVE";
      property_status_v3: "PENDING" | "APPROVED" | "REJECTED" | "HIDDEN" | "DELETED";
      property_type_v3: "HOUSE" | "APARTMENT" | "ROOM" | "VILLA" | "OFFICE" | "SHOP" | "LAND";
      report_status_v3: "OPEN" | "IN_REVIEW" | "CLOSED";
    };
  };
};
