import { createAdminClient, createClient } from "@/lib/supabase/server";

export class SubscriptionService {
  /**
   * Creates a permanent FREE subscription for a new OWNER or AGENCY user.
   */
  static async createTrialSubscription(userId: string): Promise<any> {
    const supabaseAdmin = await createAdminClient();
    const startDate = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("subscriptions")
      .insert({
        userId,
        status: "FREE",
        price: 0,
        startDate,
        endDate: null,
      } as any)
      .select()
      .single();

    if (error) {
      console.error("Erreur de création de l'abonnement gratuit:", error);
    }
    return data;
  }

  /**
   * Retrieves active/trial subscription status for an owner.
   */
  static async getSubscriptionStatus(userId: string): Promise<any> {
    const supabase = await createClient();
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("userId", userId)
      .order("createdAt", { ascending: false })
      .limit(1)
      .maybeSingle();

    return data;
  }
}
