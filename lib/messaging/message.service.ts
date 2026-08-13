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

    return (data ?? []).map((conv: any) => {
      const messages = Array.isArray(conv.messages) ? conv.messages : [];
      const unreadCount = messages.filter(
        (m: any) =>
          (m.receiverId === userId || m.receiver_id === userId) &&
          (m.isRead === false || m.is_read === false)
      ).length;

      return {
        ...conv,
        unreadCount,
      };
    });
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
        id: crypto.randomUUID(),
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

    // Resolve receiverId server-side from conversation participants
    const { data: conv } = await supabase
      .from("conversations")
      .select("tenantId, ownerId")
      .eq("id", conversationId)
      .single();

    if (!conv) {
      throw new Error("Conversation introuvable.");
    }

    const receiverId = conv.tenantId === senderId ? conv.ownerId : conv.tenantId;

    const { data, error } = await supabase
      .from("messages")
      .insert({
        id: crypto.randomUUID(),
        conversationId,
        senderId,
        receiverId,
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

  static async markAsRead(conversationId: string, userId: string) {
    const supabase = await createClient();
    const { error } = await supabase
      .from("messages")
      .update({ isRead: true })
      .eq("conversationId", conversationId)
      .eq("receiverId", userId)
      .eq("isRead", false);

    if (error) {
      console.error("Error marking messages as read:", error.message);
    }
  }
}
