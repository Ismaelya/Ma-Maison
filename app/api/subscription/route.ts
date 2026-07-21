import { createClient } from "@/lib/supabase/server";
import { SubscriptionService } from "@/lib/subscriptions/subscription.service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return apiError("UNAUTHORIZED", "Non authentifié", 401);
  }

  const subscription = await SubscriptionService.getSubscriptionStatus(user.id);
  return apiSuccess(subscription);
}
