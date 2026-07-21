import { createClient } from "@/lib/supabase/server";

export class MessageService {
  static async getConversations(userId: string) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("conversations")
      .select("*, property:properties(id, title, city), tenant:profiles!tenant_id(id, name, full_name, avatar_url), owner:profiles!owner_id(id, name, full_name, avatar_url)")
      .or(`tenant_id.eq.${userId},owner_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    return data ?? [];
  }

  static async createConversation(tenantId: string, propertyId: string, ownerId: string) {
    const supabase = await createClient();

    // Check if conversation already exists
    const { data: existing } = await supabase
      .from("conversations")
      .select("*")
      .eq("property_id", propertyId)
      .eq("tenant_id", tenantId)
      .single();

    if (existing) return existing;

    const { data, error } = await supabase
      .from("conversations")
      .insert({
        property_id: propertyId,
        tenant_id: tenantId,
        owner_id: ownerId,
      } as any)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async sendMessage(conversationId: string, senderId: string, content: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("conversation_messages")
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content: content,
        is_read: false,
      } as any)
      .select()
      .single();

    if (error) {
      // Fallback legacy messages table
      const { data: legacy } = await supabase
        .from("messages")
        .insert({
          sender_id: senderId,
          content: content,
          is_read: false,
        } as any)
        .select()
        .single();
      return legacy;
    }

    return data;
  }
}
