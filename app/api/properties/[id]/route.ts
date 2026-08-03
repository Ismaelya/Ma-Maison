import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PropertyService } from "@/lib/properties/property.service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { canOwnerPublish } from "@/lib/auth/helpers";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const property = await PropertyService.getProperty(id);
    if (!property) {
      return apiError("NOT_FOUND", "Annonce introuvable", 404);
    }
    return apiSuccess(property);
  } catch (err: any) {
    return apiError("SERVER_ERROR", err.message, 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return apiError("UNAUTHORIZED", "Non authentifié", 401);
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return apiError("UNAUTHORIZED", "Profil utilisateur introuvable", 401);
  }

  // Fetch most recent subscription
  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("userId", user.id)
    .order("createdAt", { ascending: false })
    .limit(1);

  const latestSubscription = subscriptions && subscriptions.length > 0 ? subscriptions[0] : null;

  // Validate owner/agency publishing permissions
  if (!canOwnerPublish(profile as any, latestSubscription as any)) {
    return apiError(
      "FORBIDDEN",
      "Votre compte ne permet pas de modifier ou republier une annonce pour le moment.",
      403
    );
  }

  try {
    const existingProperty = await PropertyService.getProperty(id);
    if (!existingProperty) {
      return apiError("NOT_FOUND", "Annonce introuvable", 404);
    }

    const isOwner = (existingProperty.ownerId || (existingProperty as any).owner_id) === user.id;
    const isAdmin = (profile.role ?? "").toUpperCase() === "ADMIN";

    if (!isOwner && !isAdmin) {
      return apiError("FORBIDDEN", "Accès refusé. Vous n'êtes pas le propriétaire de cette annonce.", 403);
    }

    const body = await request.json();
    const updated = await PropertyService.updateProperty(id, body);
    return apiSuccess(updated, "Annonce mise à jour avec succès");
  } catch (err: any) {
    return apiError("BAD_REQUEST", err.message, 400);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return apiError("UNAUTHORIZED", "Non authentifié", 401);
  }

  try {
    const existingProperty = await PropertyService.getProperty(id);
    if (!existingProperty) {
      return apiError("NOT_FOUND", "Annonce introuvable", 404);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isOwner = (existingProperty.ownerId || (existingProperty as any).owner_id) === user.id;
    const isAdmin = String(profile?.role || "").toUpperCase() === "ADMIN";

    if (!isOwner && !isAdmin) {
      return apiError("FORBIDDEN", "Accès refusé. Seul le propriétaire ou un administrateur peut supprimer cette annonce.", 403);
    }

    await PropertyService.deleteProperty(id, user.id);
    return apiSuccess(null, "Annonce supprimée avec succès");
  } catch (err: any) {
    return apiError("SERVER_ERROR", err.message, 500);
  }
}
