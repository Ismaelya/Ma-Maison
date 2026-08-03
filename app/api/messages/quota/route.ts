import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

const FREE_DAILY_LIMIT = 10;

/**
 * GET /api/messages/quota
 *
 * Returns the current user's daily messaging quota:
 *  - isPremium: true  → no limit applies
 *  - isPremium: false → used / limit / remaining counts over the last 24 hours
 *
 * Only relevant for OWNER / AGENCY accounts.
 * TENANT accounts always get isPremium: true (never limited).
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const supabaseAdmin = await createAdminClient();

    // Fetch sender profile
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = String(profile?.role ?? "").toUpperCase();

    // TENANT or ADMIN are never limited
    if (role === "TENANT" || role === "ADMIN") {
      return NextResponse.json({ isPremium: true, used: 0, limit: null, remaining: null });
    }

    // Check for an active Premium subscription
    const { data: activeSub } = await supabaseAdmin
      .from("subscriptions")
      .select("id")
      .eq("userId", user.id)
      .eq("status", "ACTIVE")
      .maybeSingle();

    if (activeSub) {
      return NextResponse.json({ isPremium: true, used: 0, limit: null, remaining: null });
    }

    // Count messages sent in the last 24 hours
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("senderId", user.id)
      .gte("createdAt", since);

    const used = count ?? 0;

    return NextResponse.json({
      isPremium: false,
      used,
      limit: FREE_DAILY_LIMIT,
      remaining: Math.max(0, FREE_DAILY_LIMIT - used),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}
