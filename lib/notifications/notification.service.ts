import { createAdminClient, createClient } from "@/lib/supabase/server";

export type NotificationType =
  | "NEW_MESSAGE"
  | "PAYMENT_APPROVED"
  | "PAYMENT_REJECTED"
  | "PROPERTY_APPROVED"
  | "PROPERTY_REJECTED"
  | "SUBSCRIPTION_EXPIRING";

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

export class NotificationService {
  /**
   * Create a notification for a user (called internally by system actions or triggers)
   */
  static async createNotification(params: CreateNotificationParams) {
    let attempts = 0;
    while (attempts < 3) {
      try {
        attempts++;
        const supabase = await createAdminClient();
        const { data, error } = await supabase
          .from("notifications")
          .insert({
            userId: params.userId,
            type: params.type,
            title: params.title,
            message: params.message,
            link: params.link || null,
            isRead: false,
            createdAt: new Date().toISOString(),
          })
          .select()
          .single();

        if (!error && data) return data;
      } catch (err: any) {
        if (attempts >= 3) {
          console.error("Failed to create notification after attempts:", err.message);
        } else {
          await new Promise((r) => setTimeout(r, 500));
        }
      }
    }
    return null;
  }

  /**
   * Get notifications for the authenticated user
   */
  static async getUserNotifications(userId: string, limit: number = 20) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("userId", userId)
        .order("createdAt", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching notifications:", error);
        return [];
      }

      return data || [];
    } catch (err: any) {
      console.error("Error fetching notifications:", err.message);
      return [];
    }
  }

  /**
   * Mark a notification as read
   */
  static async markAsRead(notificationId: string, userId: string) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("notifications")
        .update({ isRead: true })
        .eq("id", notificationId)
        .eq("userId", userId)
        .select()
        .single();

      if (error) {
        console.error("Error marking notification as read:", error);
      }
      return data;
    } catch (err: any) {
      console.error("Error marking notification as read:", err.message);
      return null;
    }
  }
}
