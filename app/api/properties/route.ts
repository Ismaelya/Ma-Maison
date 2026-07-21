import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PropertyService } from "@/lib/properties/property.service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const filters = {
    city: searchParams.get("city") ?? undefined,
    district: searchParams.get("district") ?? undefined,
    type: searchParams.get("type") ?? undefined,
    minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
    maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
    rooms: searchParams.get("rooms") ? Number(searchParams.get("rooms")) : undefined,
  };

  try {
    const properties = await PropertyService.searchProperties(filters);
    return apiSuccess(properties);
  } catch (err: any) {
    return apiError("SERVER_ERROR", err.message || "Erreur de recherche", 500);
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return apiError("UNAUTHORIZED", "Non authentifié", 401);
  }

  try {
    const body = await request.json();
    const newProperty = await PropertyService.createProperty(user.id, body);
    return apiSuccess(newProperty, "Annonce créée avec succès", 201);
  } catch (err: any) {
    return apiError("BAD_REQUEST", err.message || "Erreur de création de l'annonce", 400);
  }
}
