import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return apiError("UNAUTHORIZED", "Non authentifié", 401);
  }

  try {
    // 1. Fetch conversation to verify participation
    const { data: conversation } = await supabase
      .from("conversations")
      .select("id, tenantId, ownerId")
      .eq("id", conversationId)
      .single();

    if (!conversation) {
      return apiError("NOT_FOUND", "Conversation introuvable", 404);
    }

    if (conversation.tenantId !== user.id && conversation.ownerId !== user.id) {
      return apiError("FORBIDDEN", "Accès refusé à cette conversation", 403);
    }

    // 2. Fetch messages in chronological order
    const { data: messages, error } = await supabase
      .from("messages")
      .select("*, sender:profiles!senderId(id, name, avatarUrl)")
      .eq("conversationId", conversationId)
      .order("createdAt", { ascending: true });

    if (error) {
      return apiError("SERVER_ERROR", error.message, 500);
    }

    // 3. Mark received unread messages as read
    await supabase
      .from("messages")
      .update({ isRead: true })
      .eq("conversationId", conversationId)
      .eq("receiverId", user.id)
      .eq("isRead", false);

    return apiSuccess(messages ?? []);
  } catch (err: any) {
    return apiError("SERVER_ERROR", err.message || "Erreur de chargement des messages", 500);
  }
}
