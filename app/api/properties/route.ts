import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PropertyService } from "@/lib/properties/property.service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { canOwnerPublish } from "@/lib/auth/helpers";
import { prisma } from "@/lib/prisma/client";
import { listingSchema } from "@/lib/validations/listing";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const filters = {
      type: searchParams.get("type") || undefined,
      city: searchParams.get("city") || undefined,
      district: searchParams.get("district") || undefined,
      minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
      maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
      rooms: searchParams.get("rooms") ? Number(searchParams.get("rooms")) : undefined,
      bathrooms: searchParams.get("bathrooms") ? Number(searchParams.get("bathrooms")) : undefined,
      q: searchParams.get("q") || searchParams.get("search") || undefined,
      sortBy: (searchParams.get("sortBy") as any) || "createdAt",
      sortOrder: (searchParams.get("sortOrder") as any) || "desc",
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 12,
    };

    const properties = await PropertyService.getProperties(filters);
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      const sanitized = (properties as any[]).map((property) => {
        const { address, ...rest } = property as any;
        return rest;
      });
      return apiSuccess(sanitized, "Annonces récupérées avec succès", 200);
    }

    return apiSuccess(properties, "Annonces récupérées avec succès", 200);
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
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return apiError("UNAUTHORIZED", "Profil utilisateur introuvable", 401);
  }

  // Fetch most recent subscription with Prisma fallback
  let latestSubscription: any = null;
  try {
    const { data: subscriptions } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("userId", user.id)
      .order("createdAt", { ascending: false })
      .limit(1);
    if (subscriptions && subscriptions.length > 0) {
      latestSubscription = subscriptions[0];
    }
  } catch {
    // Ignore Supabase REST error
  }

  if (!latestSubscription) {
    try {
      latestSubscription = await prisma.subscription.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      });
    } catch {
      // Ignore DB error
    }
  }

  // Validate owner/agency publishing permissions
  if (!canOwnerPublish(profile as any, latestSubscription as any)) {
    return apiError(
      "FORBIDDEN",
      "Votre compte ne permet pas de publier une annonce pour le moment.",
      403
    );
  }

  try {
    const body = await request.json();

    const parsed = listingSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message || "Données invalides",
        400
      );
    }

    const newProperty = await PropertyService.createProperty(user.id, { ...body, ...parsed.data });
    return apiSuccess(newProperty, "Annonce créée avec succès", 201);
  } catch (err: any) {
    return apiError("BAD_REQUEST", err.message || "Erreur de création de l'annonce", 400);
  }
}
