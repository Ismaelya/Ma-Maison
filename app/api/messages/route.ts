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
    const rateLimit = await messagingRateLimiter.limit(identifier);
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

    // ── Atomic RPC send_message (1 single DB network call) ──────────────────
    const { data: rpcResult, error: rpcErr } = await supabase.rpc("send_message", {
      p_conversation_id: conversationId,
      p_content: content,
    });

    if (rpcErr) {
      const isForbidden = rpcErr.message.includes("Non autorisé");
      const isNotFound = rpcErr.message.includes("introuvable");
      const status = isForbidden ? 403 : isNotFound ? 404 : 400;
      return NextResponse.json({ error: rpcErr.message }, { status });
    }

    return NextResponse.json({
      success: true,
      message: {
        id: (rpcResult as any)?.id,
        conversationId,
        senderId,
        content,
        isRead: false,
        createdAt: (rpcResult as any)?.createdAt,
      },
      quota: { isPremium: true },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}


