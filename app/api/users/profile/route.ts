import { createClient } from "@/lib/supabase/server";
import { ProfileService } from "@/lib/users/profile.service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return apiError("UNAUTHORIZED", "Non authentifié", 401);
  }

  const profile = await ProfileService.getProfile(user.id);
  return apiSuccess(profile);
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return apiError("UNAUTHORIZED", "Non authentifié", 401);
  }

  try {
    const body = await request.json();
    const updated = await ProfileService.updateProfile(user.id, body);
    return apiSuccess(updated);
  } catch (err: any) {
    return apiError("BAD_REQUEST", err.message || "Erreur de mise à jour", 400);
  }
}
