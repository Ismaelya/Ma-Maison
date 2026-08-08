import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { Profile } from "@/types";

export class ProfileRepository {
  static async findById(id: string): Promise<Profile | null> {
    const supabase = await createClient();
    const { data } = await supabase.from("profiles").select("*").eq("id", id).single();
    return data as Profile | null;
  }

  static async update(id: string, updates: Partial<Profile>): Promise<Profile> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .update(updates as any)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Profile;
  }

  static async softDelete(id: string): Promise<void> {
    const supabaseAdmin = await createAdminClient();

    // Révoque l'accès Auth en premier : si cette étape échoue, on n'anonymise
    // pas le profil — sinon le compte paraîtrait supprimé alors que les
    // anciens identifiants permettraient toujours de se connecter.
    // profiles.id n'a pas de FK vers auth.users (vérifié), donc supprimer
    // l'utilisateur Auth ne cascade pas sur la ligne profiles (conservée,
    // anonymisée — soft delete, jamais de suppression physique).
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (authError) {
      throw new Error(`Échec de la révocation de l'accès Auth : ${authError.message}`);
    }

    const anonymizedName = `Utilisateur Supprimé (${id.slice(0, 8)})`;
    const anonymizedPhone = `+22700000000_${id.slice(0, 4)}`;
    const anonymizedEmail = `deleted-${id}@ma-maison.invalid`;

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        status: "DELETED",
        name: anonymizedName,
        email: anonymizedEmail,
        phone: anonymizedPhone,
        avatarUrl: null,
      } as any)
      .eq("id", id);

    if (error) throw new Error(error.message);
  }
}
