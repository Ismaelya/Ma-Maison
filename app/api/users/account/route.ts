import { createClient } from "@/lib/supabase/server";
import { ProfileService } from "@/lib/users/profile.service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return apiError("UNAUTHORIZED", "Non authentifié", 401);
  }

  try {
    await ProfileService.softDeleteAccount(user.id);
    await supabase.auth.signOut();

    return apiSuccess(null, "Compte désactivé et anonymisé avec succès");
  } catch (err: any) {
    return apiError("SERVER_ERROR", err.message || "Erreur de suppression du compte", 500);
  }
}
