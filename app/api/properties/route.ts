import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PropertyService } from "@/lib/properties/property.service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { canOwnerPublish } from "@/lib/auth/helpers";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = searchParams.get("page") ? Number(searchParams.get("page")) : undefined;
  const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined;

  const filters = {
    city: searchParams.get("city") ?? undefined,
    district: searchParams.get("district") ?? undefined,
    type: searchParams.get("type") ?? undefined,
    transactionType: searchParams.get("transactionType") || searchParams.get("transaction") || undefined,
    minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
    maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
    rooms: searchParams.get("rooms") || searchParams.get("bedrooms") ? Number(searchParams.get("rooms") || searchParams.get("bedrooms")) : undefined,
    page,
    limit,
  };

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const properties = await PropertyService.searchProperties(filters);

    // Sanitize exact address for unauthenticated users (Security Requirement)
    const sanitizedProperties = properties.map((prop: any) => {
      if (!user) {
        const { address, ...publicData } = prop;
        return publicData;
      }
      return prop;
    });

    return apiSuccess(sanitizedProperties);
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
      "SUBSCRIPTION_REQUIRED",
      "Votre abonnement a expiré. Renouvelez-le pour publier une nouvelle annonce.",
      403
    );
  }

  try {
    const body = await request.json();
    const newProperty = await PropertyService.createProperty(user.id, body);
    return apiSuccess(newProperty, "Annonce créée avec succès", 201);
  } catch (err: any) {
    return apiError("BAD_REQUEST", err.message || "Erreur de création de l'annonce", 400);
  }
}
