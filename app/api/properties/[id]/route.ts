import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PropertyService } from "@/lib/properties/property.service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

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

  try {
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
    await PropertyService.deleteProperty(id, user.id);
    return apiSuccess(null, "Annonce supprimée avec succès");
  } catch (err: any) {
    return apiError("SERVER_ERROR", err.message, 500);
  }
}
