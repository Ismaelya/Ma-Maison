import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { messagingRateLimiter } from "@/lib/rate-limit";
import { NotificationService } from "@/lib/notifications/notification.service";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json();
    const { conversationId, content } = body;

    const senderId = user?.id || "89c59896-1b3a-49a4-9b37-b1345a48091d";
    const identifier = `messages:${senderId}`;

    // Rate limiting anti-spam check (10 messages max per minute)
    const rateLimit = await messagingRateLimiter.check(identifier);
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: "Anti-spam : Vous envoyez des messages trop rapidement. Veuillez ralentir.",
          rateLimit,
        },
        { status: 429 }
      );
    }

    if (!conversationId || !content) {
      return NextResponse.json(
        { error: "conversationId et content requis." },
        { status: 400 }
      );
    }

    // Insert message into database using admin client
    const supabaseAdmin = await createAdminClient();
    const { data: message, error: msgErr } = await supabaseAdmin
      .from("messages")
      .insert({
        id: crypto.randomUUID(),
        conversationId,
        senderId,
        content,
        isRead: false,
        createdAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (msgErr) {
      return NextResponse.json({ error: msgErr.message }, { status: 400 });
    }

    // Get conversation details to find recipient
    const { data: conv } = await supabaseAdmin
      .from("conversations")
      .select("tenantId, ownerId")
      .eq("id", conversationId)
      .single();

    if (conv) {
      const recipientId = conv.tenantId === senderId ? conv.ownerId : conv.tenantId;
      if (recipientId) {
        await NotificationService.createNotification({
          userId: recipientId,
          type: "NEW_MESSAGE",
          title: "Nouveau message reçu",
          message: `Vous avez reçu un nouveau message : "${content.slice(0, 50)}${content.length > 50 ? "..." : ""}"`,
          link: `/dashboard/messages?conversationId=${conversationId}`,
        });
      }
    }

    return NextResponse.json({ success: true, message });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}
