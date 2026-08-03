import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { messagingRateLimiter } from "@/lib/rate-limit";
import { NotificationService } from "@/lib/notifications/notification.service";

const FREE_DAILY_LIMIT = 10;

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

    const supabaseAdmin = await createAdminClient();

    // --- Free tier daily messaging limit ---
    // Only applies to OWNER / AGENCY without an ACTIVE subscription
    const { data: senderProfile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", senderId)
      .single();

    const senderRole = String(senderProfile?.role ?? "").toUpperCase();

    if (senderRole === "OWNER" || senderRole === "AGENCY") {
      // Check for an active Premium subscription
      const { data: activeSub } = await supabaseAdmin
        .from("subscriptions")
        .select("id")
        .eq("userId", senderId)
        .eq("status", "ACTIVE")
        .maybeSingle();

      if (!activeSub) {
        // Count messages sent in the last 24 hours
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { count } = await supabaseAdmin
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("senderId", senderId)
          .gte("createdAt", since);

        const used = count ?? 0;

        if (used >= FREE_DAILY_LIMIT) {
          return NextResponse.json(
            {
              error:
                "Limite de 10 messages/jour atteinte en mode Gratuit. Passez Premium pour une messagerie illimitée.",
              code: "MESSAGE_LIMIT_REACHED",
              remaining: 0,
              used,
              limit: FREE_DAILY_LIMIT,
            },
            { status: 403 }
          );
        }

        // Insert message
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

        // Notify recipient
        await notifyRecipient(supabaseAdmin, conversationId, senderId, content);

        return NextResponse.json({
          success: true,
          message,
          quota: {
            isPremium: false,
            used: used + 1,
            limit: FREE_DAILY_LIMIT,
            remaining: FREE_DAILY_LIMIT - (used + 1),
          },
        });
      }
    }

    // --- Premium / TENANT path — no daily limit ---
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

    await notifyRecipient(supabaseAdmin, conversationId, senderId, content);

    return NextResponse.json({
      success: true,
      message,
      quota: { isPremium: true },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}

async function notifyRecipient(
  supabaseAdmin: any,
  conversationId: string,
  senderId: string,
  content: string
) {
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
}
