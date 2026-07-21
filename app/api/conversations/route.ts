import { createClient } from "@/lib/supabase/server";
import { MessageService } from "@/lib/messaging/message.service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return apiError("UNAUTHORIZED", "Non authentifié", 401);
  }

  const conversations = await MessageService.getConversations(user.id);
  return apiSuccess(conversations);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return apiError("UNAUTHORIZED", "Non authentifié", 401);
  }

  try {
    const { propertyId, ownerId } = await request.json();
    const conversation = await MessageService.createConversation(user.id, propertyId, ownerId);
    return apiSuccess(conversation, "Conversation initialisée", 201);
  } catch (err: any) {
    return apiError("BAD_REQUEST", err.message || "Erreur de création de conversation", 400);
  }
}
