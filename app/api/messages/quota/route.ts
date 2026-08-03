import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const FREE_DAILY_LIMIT = 10;

/**
 * GET /api/messages/quota
 *
 * Returns the current user's daily messaging quota.
 * Uses SECURITY DEFINER RPC functions — no createAdminClient() needed.
 *
 *  - isPremium: true  → no limit applies (Premium sub or TENANT/ADMIN role)
 *  - isPremium: false → used / limit / remaining counts over the last 24 hours
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

    // Read own profile (RLS: users can read their own profile)
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = String(profile?.role ?? "").toUpperCase();

    // TENANT and ADMIN are never subject to the daily limit
    if (role === "TENANT" || role === "ADMIN") {
      return NextResponse.json({ isPremium: true, used: 0, limit: null, remaining: null });
    }

    // Use narrow SECURITY DEFINER RPC — returns boolean only, no data leakage
    const { data: isPremium, error: subErr } = await supabase.rpc(
      "has_active_subscription",
      { p_user_id: user.id }
    );

    if (!subErr && isPremium) {
      return NextResponse.json({ isPremium: true, used: 0, limit: null, remaining: null });
    }

    // Count own messages in last 24h via SECURITY DEFINER RPC
    const { data: used24h, error: countErr } = await supabase.rpc(
      "count_daily_messages",
      { p_user_id: user.id }
    );

    const used = (countErr ? 0 : (used24h ?? 0)) as number;

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
