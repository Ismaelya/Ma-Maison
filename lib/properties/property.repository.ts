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
  page?: number;
  limit?: number;
  q?: string;
};

export class PropertyRepository {
  static async search(filters: PropertyFilterOptions = {}): Promise<Property[]> {
    try {
      const whereClause: any = {
        status: "APPROVED",
        owner: {
          status: "ACTIVE",
        },
      };

      if (filters.city) {
        whereClause.city = filters.city;
      }
      if (filters.district) {
        whereClause.district = { contains: filters.district, mode: "insensitive" };
      }
      if (filters.type) {
        whereClause.type = filters.type.toUpperCase();
      }

      const results = await prisma.property.findMany({
        where: whereClause,
        include: {
          owner: {
            include: {
              subscriptions: {
                where: { status: "ACTIVE" },
                select: { id: true, status: true },
                orderBy: { createdAt: "desc" },
                take: 1,
              },
            },
          },
          images: true,
        },
        orderBy: { createdAt: "desc" },
      });

      if (results && results.length > 0) {
        const sorted = [...results].sort((a, b) => {
          const aPremium = (a.owner as any)?.subscriptions?.length > 0;
          const bPremium = (b.owner as any)?.subscriptions?.length > 0;

          if (aPremium !== bPremium) {
            return aPremium ? -1 : 1;
          }

          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        return sorted as unknown as Property[];
      }
    } catch {
      // Ignore Prisma search error
    }

    const supabase = await createClient();
    let query = supabase
      .from("properties")
      .select(
        "*, property_images(*), profiles!inner(id, name, agencyName, badgeVerified, avatarUrl, phone, status, subscriptions!left(id, status, createdAt))",
        { count: "exact" }
      )
      .eq("status", "APPROVED")
      .eq("profiles.status", "ACTIVE")
      .order("createdAt", { ascending: false });

    if (filters.city) {
      query = query.eq("city", filters.city);
    }

    const { data } = await query;
    const sorted = (data ?? []).sort((a: any, b: any) => {
      const aPremium = (a.profiles?.subscriptions ?? []).some((sub: any) => String(sub.status).toUpperCase() === "ACTIVE");
      const bPremium = (b.profiles?.subscriptions ?? []).some((sub: any) => String(sub.status).toUpperCase() === "ACTIVE");

      if (aPremium !== bPremium) {
        return aPremium ? -1 : 1;
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return sorted as unknown as Property[];
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

  static async update(id: string, updates: Partial<Property>): Promise<Property> {
    try {
      const updated = await prisma.property.update({
        where: { id },
        data: updates as any,
      });
      return updated as unknown as Property;
    } catch {
      // Ignore
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("properties")
      .update(updates as any)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as unknown as Property;
  }

  static async delete(id: string): Promise<void> {
    try {
      await prisma.property.delete({ where: { id } });
      return;
    } catch {
      // Ignore
    }

    const supabase = await createClient();
    await supabase.from("properties").delete().eq("id", id);
  }
}
