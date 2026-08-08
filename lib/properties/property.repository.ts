import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
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
    try {
      const res = await prisma.property.findUnique({
        where: { id },
        include: { images: true, owner: true },
      });
      if (res) return res as unknown as Property;
    } catch {
      // Ignore
    }

    const supabase = await createClient();
    const { data } = await supabase
      .from("properties")
      .select("*, property_images(*), profiles!inner(id, name, badgeVerified, avatarUrl, phone)")
      .eq("id", id)
      .single();

    return data as unknown as Property | null;
  }

  static async create(propertyData: Partial<Property> & { images?: string[] }): Promise<Property> {
    const propertyId = crypto.randomUUID();
    const { images, ownerId, ...rest } = propertyData as any;

    try {
      const created = await prisma.property.create({
        data: {
          id: propertyId,
          ownerId: ownerId,
          title: rest.title,
          description: rest.description,
          type: (rest.type || "HOUSE").toUpperCase() as any,
          price: Number(rest.price),
          city: rest.city,
          district: rest.district || rest.city,
          address: rest.address || null,
          rooms: Number(rest.rooms || 1),
          bathrooms: Number(rest.bathrooms || 1),
          surface: rest.surface ? Number(rest.surface) : null,
          status: (rest.status || "PENDING").toUpperCase() as any,
        },
      });

      if (images && Array.isArray(images) && images.length > 0) {
        await prisma.propertyImage.createMany({
          data: images.map((url: string, index: number) => ({
            id: crypto.randomUUID(),
            propertyId: created.id,
            url,
            order: index,
          })),
        });
      }

      return created as unknown as Property;
    } catch (prismaErr) {
      console.warn("Prisma property creation warning:", prismaErr);
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("properties")
      .insert({ id: propertyId, ownerId, ...rest })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return data as unknown as Property;
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
    if (sanitized.price !== undefined) sanitized.price = Number(sanitized.price);
    if (sanitized.rooms !== undefined) sanitized.rooms = Number(sanitized.rooms);
    if (sanitized.bathrooms !== undefined) sanitized.bathrooms = Number(sanitized.bathrooms);
    if (sanitized.surface !== undefined) {
      sanitized.surface = sanitized.surface != null ? Number(sanitized.surface) : null;
    }

    const images = (updates as any).images;

    const updated = await prisma.property.update({
      where: { id },
      data: sanitized,
    });

    if (Array.isArray(images)) {
      await prisma.propertyImage.deleteMany({ where: { propertyId: id } });
      if (images.length > 0) {
        await prisma.propertyImage.createMany({
          data: images.map((url: string, index: number) => ({
            id: crypto.randomUUID(),
            propertyId: id,
            url,
            order: index,
          })),
        });
      }
    }

    return updated as unknown as Property;
  }

  static async delete(id: string): Promise<void> {
    await prisma.$transaction([
      prisma.message.deleteMany({ where: { conversation: { propertyId: id } } }),
      prisma.conversation.deleteMany({ where: { propertyId: id } }),
      prisma.favorite.deleteMany({ where: { propertyId: id } }),
      prisma.review.deleteMany({ where: { propertyId: id } }),
      prisma.report.deleteMany({ where: { propertyId: id } }),
      prisma.propertyImage.deleteMany({ where: { propertyId: id } }),
    ]);

    const result = await prisma.property.deleteMany({ where: { id } });
    if (result.count === 0) {
      throw new Error(`Suppression impossible : annonce introuvable (id: ${id})`);
    }
  }
}
