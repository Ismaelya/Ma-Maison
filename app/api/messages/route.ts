import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { messagingRateLimiter } from "@/lib/rate-limit";
import { NotificationService } from "@/lib/notifications/notification.service";

const FREE_DAILY_LIMIT = 10;

export async function POST(request: Request) {
  try {
    // ── Authenticated user client (subject to RLS) ────────────────────────
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json();
    const { conversationId, content } = body;

    if (!conversationId || !content) {
      return NextResponse.json(
        { error: "conversationId et content requis." },
        { status: 400 }
      );
    }

    if (!user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const senderId = user.id;
    const identifier = `messages:${senderId}`;

    // ── Rate limiting anti-spam (10 messages / minute) ────────────────────
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

    // ── Read sender role via authenticated client (user reads own profile) ─
    // RLS: profiles are readable by the owner themselves.
    const { data: senderProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", senderId)
      .single();

    const senderRole = String(senderProfile?.role ?? "").toUpperCase();

    // ── Free-tier daily limit (OWNER / AGENCY only) ───────────────────────
    if (senderRole === "OWNER" || senderRole === "AGENCY") {
      // Use a narrow SECURITY DEFINER RPC — never a generic admin client.
      // has_active_subscription() reads subscriptions bypassing RLS,
      // but returns only a boolean: callers cannot extract other users' data.
      const { data: isPremium, error: subErr } = await supabase.rpc(
        "has_active_subscription",
        { p_user_id: senderId }
      );

      if (!subErr && !isPremium) {
        // count_daily_messages() counts own messages via SECURITY DEFINER.
        const { data: used24h, error: countErr } = await supabase.rpc(
          "count_daily_messages",
          { p_user_id: senderId }
        );

        const used = (countErr ? 0 : (used24h ?? 0)) as number;

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

        // ── INSERT via authenticated client → RLS messages_participants_send enforced ──
        // Policy: senderId = auth.uid() AND user is tenant OR owner of conversation.
        // This prevents inserting into conversations the sender doesn't belong to.
        const { data: message, error: msgErr } = await supabase
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

        // Notify recipient — admin client is legitimate here: the server
        // needs to find the other participant's ID to write their notification.
        await notifyRecipient(conversationId, senderId, content);

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

    // ── Premium / TENANT path — INSERT via authenticated client (RLS enforced) ─
    const { data: message, error: msgErr } = await supabase
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

    await notifyRecipient(conversationId, senderId, content);

    return NextResponse.json({
      success: true,
      message,
      quota: { isPremium: true },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}

/**
 * Sends a NEW_MESSAGE notification to the other participant.
 * Uses admin client here — this is the only legitimate use of elevated privilege
 * in this route: the server needs to read both participant IDs to write a
 * notification for the recipient without exposing them to the sender.
 */
async function notifyRecipient(
  conversationId: string,
  senderId: string,
  content: string
) {
  try {
    const supabaseAdmin = await createAdminClient();
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
  } catch {
    // Notification failure is non-fatal — message was already inserted
  }
}
