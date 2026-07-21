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
    const anonymizedName = `Utilisateur Supprimé (${id.slice(0, 8)})`;
    const anonymizedPhone = `+22700000000_${id.slice(0, 4)}`;

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        status: "DELETED",
        account_status: "DELETED",
        name: anonymizedName,
        full_name: anonymizedName,
        phone: anonymizedPhone,
        avatar_url: null,
      } as any)
      .eq("id", id);

    if (error) throw new Error(error.message);
  }
}
