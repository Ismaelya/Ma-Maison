import { createAdminClient, createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return apiError("UNAUTHORIZED", "Non authentifié", 401);
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "ADMIN" && profile?.role !== "admin") {
    return apiError("FORBIDDEN", "Accès interdit", 403);
  }

  const supabaseAdmin = await createAdminClient();
  const { data } = await supabaseAdmin
    .from("payments")
    .select("*, user:profiles!userId(id, name, email, phone)")
    .order("createdAt", { ascending: false });

  return apiSuccess(data ?? []);
}
