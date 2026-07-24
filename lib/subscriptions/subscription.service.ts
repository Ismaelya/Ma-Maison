import { createAdminClient, createClient } from "@/lib/supabase/server";

export class SubscriptionService {
  /**
   * Creates an initial TRIAL subscription for a new OWNER or AGENCY user.
   * TRIAL duration: 30 days.
   */
  static async createTrialSubscription(userId: string): Promise<any> {
    const supabaseAdmin = await createAdminClient();
    const startDate = new Date().toISOString();
    const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabaseAdmin
      .from("subscriptions")
      .insert({
        userId,
        status: "TRIAL",
        price: 1500,
        startDate,
        endDate,
      } as any)
      .select()
      .single();

    if (error) {
      console.error("Erreur de création de l'abonnement d'essai:", error);
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
