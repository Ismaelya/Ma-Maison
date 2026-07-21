import { createAdminClient, createClient } from "@/lib/supabase/server";

export class SubscriptionService {
  /**
   * Creates an initial TRIAL subscription for a new OWNER user.
   * TRIAL duration: 30 days.
   */
  static async createTrialSubscription(ownerId: string): Promise<any> {
    const supabaseAdmin = await createAdminClient();
    const startDate = new Date().toISOString();
    const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabaseAdmin
      .from("subscriptions")
      .insert({
        owner_id: ownerId,
        user_id: ownerId,
        status: "TRIAL",
        price: 1500,
        start_date: startDate,
        end_date: endDate,
        expires_at: endDate,
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
  static async getSubscriptionStatus(ownerId: string): Promise<any> {
    const supabase = await createClient();
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .or(`owner_id.eq.${ownerId},user_id.eq.${ownerId}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    return data;
  }
}
