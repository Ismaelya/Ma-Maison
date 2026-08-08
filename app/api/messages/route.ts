import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { messagingRateLimiter } from "@/lib/rate-limit";
import { NotificationService } from "@/lib/notifications/notification.service";

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

    // ── Free-tier daily message limit: DISABLED ────────────────────────────
    // Premium is currently paused, so the 10 msg/day cap on OWNER/AGENCY
    // accounts had no escape hatch — it was a pure restriction with no
    // upgrade path available to the user. Removed until Premium is
    // reactivated. To reinstate: restore the has_active_subscription() /
    // count_daily_messages() check that used to gate the insert below
    // (see git history on this file) and re-add the FREE_DAILY_LIMIT
    // constant and quota fields in the response.

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
