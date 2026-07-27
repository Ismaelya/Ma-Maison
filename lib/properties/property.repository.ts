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
  page?: number;
  limit?: number;
  q?: string;
};

export class PropertyRepository {
  static async search(filters: PropertyFilterOptions = {}): Promise<Property[]> {
    const supabase = await createClient();

    let query = supabase
      .from("properties")
      .select("*, property_images(*), profiles!inner(id, name, agencyName, badgeVerified, avatarUrl, phone)", { count: "exact" })
      .eq("status", "APPROVED")
      .order("createdAt", { ascending: false });

    if (filters.q && filters.q.trim()) {
      const kw = filters.q.trim();
      query = query.or(`title.ilike.%${kw}%,description.ilike.%${kw}%,district.ilike.%${kw}%,city.ilike.%${kw}%`);
    }
    if (filters.city) {
      query = query.eq("city", filters.city);
    }
    if (filters.district) {
      query = query.ilike("district", `%${filters.district}%`);
    }
    if (filters.type) {
      query = query.eq("type", filters.type.toUpperCase() as any);
    }
    if (filters.transactionType) {
      query = query.eq("transactionType", filters.transactionType.toUpperCase() as any);
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

    if (filters.page && filters.limit) {
      const from = (filters.page - 1) * filters.limit;
      const to = filters.page * filters.limit - 1;
      query = query.range(from, to);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      const { data: legacy } = await supabase
        .from("listings")
        .select("*, profiles!inner(id, name, full_name, badge_verified, avatar_url, phone)")
        .order("created_at", { ascending: false });
      return (legacy ?? []) as unknown as Property[];
    }

    return data as unknown as Property[];
  }

  static async findById(id: string): Promise<Property | null> {
    const supabase = await createClient();
    let { data } = await supabase
      .from("properties")
      .select("*, property_images(*), profiles!inner(id, name, full_name, badge_verified, avatar_url, phone)")
      .eq("id", id)
      .single();

    if (!data) {
      const { data: legacy } = await supabase
        .from("listings")
        .select("*, profiles!inner(id, name, full_name, badge_verified, avatar_url, phone)")
        .eq("id", id)
        .single();
      data = legacy as any;
    }

    return data as unknown as Property | null;
  }

  static async create(propertyData: Partial<Property> & { images?: string[] }): Promise<Property> {
    const supabase = await createClient();
    const { images, ...dataToInsert } = propertyData as any;

    const { data, error } = await supabase
      .from("properties")
      .insert(dataToInsert)
      .select()
      .single();

    if (error) throw new Error(error.message);

    if (images && Array.isArray(images) && images.length > 0) {
      const imageRecords = images.map((url: string, index: number) => ({
        propertyId: data.id,
        url,
        order: index,
      }));
      await supabase.from("property_images").insert(imageRecords);
    }

    return data as unknown as Property;
  }

  static async update(id: string, updates: Partial<Property>): Promise<Property> {
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
    const supabaseAdmin = await createAdminClient();
    const { error } = await supabaseAdmin.from("properties").delete().eq("id", id);
    if (error) {
      await supabaseAdmin.from("listings").delete().eq("id", id);
    }
  }
}
