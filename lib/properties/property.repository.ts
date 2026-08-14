import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { Property } from "@/types";

export type PropertyFilterOptions = {
  city?: string;
  district?: string;
  type?: string;
  transactionType?: string;
  minPrice?: number;
  maxPrice?: number;
  rooms?: number;
  bathrooms?: number;
  furnished?: boolean;
  rentalPeriod?: string;
  page?: number;
  limit?: number;
  q?: string;
  sortBy?: "createdAt" | "price";
  sortOrder?: "asc" | "desc";
};

function escapePostgrestValue(value: string): string {
  return value.replace(/[%,()]/g, (match) => `\\${match}`);
}

export class PropertyRepository {
  static async search(filters: PropertyFilterOptions = {}): Promise<Property[]> {
    const supabase = await createClient();

    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, Math.min(filters.limit || 12, 100));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const sortColumn = filters.sortBy === "price" ? "price" : "createdAt";
    const ascending = filters.sortOrder === "asc";

    let query = supabase
      .from("properties")
      .select("*, property_images(*), profiles!inner(id, name, agencyName, badgeVerified, avatarUrl, phone, status)")
      .eq("status", "APPROVED")
      .eq("profiles.status", "ACTIVE");

    if (filters.city) {
      query = query.eq("city", filters.city);
    }
    if (filters.district) {
      query = query.ilike("district", `%${escapePostgrestValue(filters.district)}%`);
    }
    if (filters.type) {
      query = query.eq("type", filters.type.toUpperCase());
    }
    if (filters.transactionType) {
      query = query.eq("transactionType", filters.transactionType.toUpperCase());
    }
    if (filters.minPrice !== undefined) {
      query = query.gte("price", filters.minPrice);
    }
    if (filters.maxPrice !== undefined) {
      query = query.lte("price", filters.maxPrice);
    }
    if (filters.rooms !== undefined) {
      query = query.gte("rooms", filters.rooms);
    }
    if (filters.bathrooms !== undefined) {
      query = query.gte("bathrooms", filters.bathrooms);
    }
    if (filters.furnished !== undefined) {
      query = query.eq("furnished", filters.furnished);
    }
    if (filters.rentalPeriod) {
      query = query.eq("rentalPeriod", filters.rentalPeriod.toUpperCase());
    }
    if (filters.q) {
      const q = escapePostgrestValue(filters.q);
      query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
    }

    query = query
      .order("isFeatured", { ascending: false })
      .order(sortColumn, { ascending })
      .range(from, to);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return (data ?? []) as unknown as Property[];
  }

  static async findById(id: string): Promise<Property | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("properties")
      .select("*, property_images(*), profiles!inner(id, name, badgeVerified, avatarUrl, phone)")
      .eq("id", id)
      .single();

    if (error) {
      // PGRST116 = no rows returned — not an error worth throwing
      if (error.code === "PGRST116") return null;
      throw new Error(error.message);
    }

    return data as unknown as Property | null;
  }

  static async create(propertyData: Partial<Property> & { images?: string[] }): Promise<Property> {
    const propertyId = crypto.randomUUID();
    const { images, ownerId, ...rest } = propertyData as any;
    const imageUrls: string[] = Array.isArray(images)
      ? images.filter((url: unknown): url is string => typeof url === "string" && url.length > 0)
      : [];

    // Use a single authenticated Supabase client for both the property row and
    // its images. If either insertion fails, a real error is thrown immediately —
    // never a half-created listing with a silent success.
    const supabase = await createClient();

    const { data: created, error: propError } = await supabase
      .from("properties")
      .insert({
        id: propertyId,
        ownerId,
        title: rest.title,
        description: rest.description,
        type: (rest.type || "HOUSE").toUpperCase(),
        transactionType: (rest.transactionType || "RENT").toUpperCase(),
        price: Number(rest.price),
        city: rest.city,
        district: rest.district || rest.city,
        address: rest.address || null,
        rooms: Number(rest.rooms || 1),
        bathrooms: Number(rest.bathrooms || 1),
        surface: rest.surface ? Number(rest.surface) : null,
        furnished: Boolean(rest.furnished),
        rentalPeriod: rest.rentalPeriod ? String(rest.rentalPeriod).toUpperCase() : null,
        whatsappNumber: rest.whatsappNumber || null,
        availability: rest.availability ? String(rest.availability).toUpperCase() : "AVAILABLE",
        latitude: rest.latitude != null ? Number(rest.latitude) : null,
        longitude: rest.longitude != null ? Number(rest.longitude) : null,
        status: (rest.status || "PENDING").toUpperCase(),
        updatedAt: rest.updatedAt || new Date().toISOString(),
      })
      .select()
      .single();

    if (propError) {
      throw new Error(`Échec de la création de l'annonce : ${propError.message}`);
    }

    if (imageUrls.length > 0) {
      const imageRows = imageUrls.map((url, index) => ({
        id: crypto.randomUUID(),
        propertyId: propertyId,
        url,
        order: index,
      }));

      const { error: imagesError } = await supabase
        .from("property_images")
        .insert(imageRows);

      if (imagesError) {
        throw new Error(`Propriété créée mais échec de l'insertion des images : ${imagesError.message}`);
      }
    }

    return created as unknown as Property;
  }

  private static readonly UPDATABLE_FIELDS = [
    "title",
    "description",
    "price",
    "city",
    "district",
    "address",
    "rooms",
    "bathrooms",
    "surface",
    "type",
    "transactionType",
    "furnished",
    "rentalPeriod",
    "availability",
    "whatsappNumber",
  ] as const;

  static async update(id: string, updates: Partial<Property> & { images?: string[] }): Promise<Property> {
    const sanitized: Record<string, any> = {};
    for (const key of PropertyRepository.UPDATABLE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(updates, key)) {
        sanitized[key] = (updates as any)[key];
      }
    }
    if (sanitized.type) sanitized.type = String(sanitized.type).toUpperCase();
    if (sanitized.transactionType) sanitized.transactionType = String(sanitized.transactionType).toUpperCase();
    if (sanitized.availability) sanitized.availability = String(sanitized.availability).toUpperCase();
    if (sanitized.price !== undefined) sanitized.price = Number(sanitized.price);
    if (sanitized.rooms !== undefined) sanitized.rooms = Number(sanitized.rooms);
    if (sanitized.bathrooms !== undefined) sanitized.bathrooms = Number(sanitized.bathrooms);
    if (sanitized.surface !== undefined) {
      sanitized.surface = sanitized.surface != null ? Number(sanitized.surface) : null;
    }
    if (sanitized.furnished !== undefined) sanitized.furnished = Boolean(sanitized.furnished);
    if (sanitized.rentalPeriod !== undefined) {
      sanitized.rentalPeriod = sanitized.rentalPeriod ? String(sanitized.rentalPeriod).toUpperCase() : null;
    }
    if (sanitized.whatsappNumber !== undefined) {
      sanitized.whatsappNumber = sanitized.whatsappNumber ? String(sanitized.whatsappNumber) : null;
    }
    // La période de location n'a de sens qu'en location : on la vide dès que
    // la transaction bascule en vente, même si l'appelant ne l'a pas renvoyée.
    if (sanitized.transactionType === "SALE" && sanitized.rentalPeriod === undefined) {
      sanitized.rentalPeriod = null;
    }

    const images = (updates as any).images;

    // Use the admin client to bypass RLS on updates (owner or admin caller).
    const supabase = await createAdminClient();

    const { data: updated, error: updateError } = await supabase
      .from("properties")
      .update(sanitized)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Échec de la mise à jour de l'annonce : ${updateError.message}`);
    }

    if (Array.isArray(images)) {
      const { error: deleteError } = await supabase
        .from("property_images")
        .delete()
        .eq("propertyId", id);

      if (deleteError) {
        throw new Error(`Échec de la suppression des anciennes images : ${deleteError.message}`);
      }

      if (images.length > 0) {
        const imageRows = images.map((url: string, index: number) => ({
          id: crypto.randomUUID(),
          propertyId: id,
          url,
          order: index,
        }));

        const { error: insertError } = await supabase
          .from("property_images")
          .insert(imageRows);

        if (insertError) {
          throw new Error(`Échec de l'insertion des nouvelles images : ${insertError.message}`);
        }
      }
    }

    return updated as unknown as Property;
  }

  static async delete(id: string): Promise<void> {
    const supabase = await createAdminClient();

    // Delete related data first (cascade via FK may handle some, but explicit
    // order avoids constraint violations if ON DELETE RESTRICT is set).
    const relatedTables: { table: string; column: string }[] = [
      { table: "messages", column: "conversationId" },
      { table: "conversations", column: "propertyId" },
      { table: "favorites", column: "propertyId" },
      { table: "reviews", column: "propertyId" },
      { table: "reports", column: "propertyId" },
      { table: "property_images", column: "propertyId" },
    ];

    // Delete messages via conversations first
    const { data: convRows } = await supabase
      .from("conversations")
      .select("id")
      .eq("propertyId", id);

    if (convRows && convRows.length > 0) {
      const convIds = convRows.map((c: any) => c.id);
      const { error: msgError } = await supabase
        .from("messages")
        .delete()
        .in("conversationId", convIds);
      if (msgError) throw new Error(`Échec suppression messages : ${msgError.message}`);
    }

    // Delete the remaining related rows
    for (const { table, column } of relatedTables.slice(1)) {
      const { error } = await supabase.from(table).delete().eq(column, id);
      if (error) throw new Error(`Échec suppression ${table} : ${error.message}`);
    }

    const { error: propError, count } = await supabase
      .from("properties")
      .delete()
      .eq("id", id);

    if (propError) throw new Error(`Échec suppression annonce : ${propError.message}`);
    if (count === 0) throw new Error(`Suppression impossible : annonce introuvable (id: ${id})`);
  }
}
