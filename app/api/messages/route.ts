import { createClient } from "@/lib/supabase/server";
import { MessageService } from "@/lib/messaging/message.service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return apiError("UNAUTHORIZED", "Non authentifié", 401);
  }

  try {
    const { conversationId, content } = await request.json();
    const msg = await MessageService.sendMessage(conversationId, user.id, content);
    return apiSuccess(msg, "Message envoyé", 201);
  } catch (err: any) {
    return apiError("BAD_REQUEST", err.message || "Erreur d'envoi du message", 400);
  }
}
