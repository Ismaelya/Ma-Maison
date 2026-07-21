import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return apiError("UNAUTHORIZED", "Non authentifié", 401);
  }

  const { data } = await supabase
    .from("favorites")
    .select("*, property:properties(*, property_images(*))")
    .eq("user_id", user.id);

  return apiSuccess(data ?? []);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return apiError("UNAUTHORIZED", "Non authentifié", 401);
  }

  try {
    const { propertyId } = await request.json();

    const { data, error } = await supabase
      .from("favorites")
      .insert({ user_id: user.id, property_id: propertyId } as any)
      .select()
      .single();

    if (error && error.code === "23505") {
      return apiSuccess(null, "Déjà dans vos favoris");
    }

    if (error) throw new Error(error.message);
    return apiSuccess(data, "Ajouté aux favoris", 201);
  } catch (err: any) {
    return apiError("BAD_REQUEST", err.message, 400);
  }
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return apiError("UNAUTHORIZED", "Non authentifié", 401);
  }

  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get("propertyId");

  if (!propertyId) {
    return apiError("BAD_REQUEST", "Identifiant manquant", 400);
  }

  await supabase
    .from("favorites")
    .delete()
    .eq("user_id", user.id)
    .eq("property_id", propertyId);

  return apiSuccess(null, "Retiré des favoris");
}
