import { createClient } from "@/lib/supabase/server";

export class MessageService {
  static async getConversations(userId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("conversations")
      .select("*, property:properties(id, title, city), tenant:profiles!tenantId(id, name, avatarUrl), owner:profiles!ownerId(id, name, avatarUrl), messages(*)")
      .or(`tenantId.eq.${userId},ownerId.eq.${userId}`)
      .order("createdAt", { ascending: false });

    if (error) {
      console.error("Error fetching conversations:", error.message);
      return [];
    }

    return data ?? [];
  }

  static async createConversation(tenantId: string, propertyId: string, ownerId: string) {
    const supabase = await createClient();

    // Check if conversation already exists for this property and tenant
    const { data: existing } = await supabase
      .from("conversations")
      .select("*")
      .eq("propertyId", propertyId)
      .eq("tenantId", tenantId)
      .maybeSingle();

    if (existing) return existing;

    const { data, error } = await supabase
      .from("conversations")
      .insert({
        propertyId,
        tenantId,
        ownerId,
      } as any)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async sendMessage(conversationId: string, senderId: string, content: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversationId,
        senderId,
        content,
        isRead: false,
      } as any)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Update conversation timestamp
    await supabase
      .from("conversations")
      .update({ updatedAt: new Date().toISOString() })
      .eq("id", conversationId);

    return data;
  }
}
