// Supabase Edge Function: expire-trials
// Runs daily via pg_cron to mark owners as expired after their 30-day trial.
//
// This is a BACKUP mechanism — the primary expiration is handled by the
// SQL function `expire_owner_trials()` called directly by pg_cron.
// This Edge Function provides an HTTP-accessible endpoint for manual triggers
// and monitoring.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify authorization — only service_role or cron should call this
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Find owners whose trial has expired and who have no active subscription
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: expiredOwners, error: fetchError } = await supabase
      .from("profiles")
      .select("id, email, full_name, trial_started_at")
      .eq("role", "owner")
      .eq("status", "active")
      .not("trial_started_at", "is", null)
      .lt("trial_started_at", thirtyDaysAgo.toISOString());

    if (fetchError) {
      throw new Error(`Failed to fetch expired owners: ${fetchError.message}`);
    }

    const ownersToExpire: string[] = [];

    for (const owner of expiredOwners ?? []) {
      // Check if owner has an active subscription
      const { data: activeSub } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("owner_id", owner.id)
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString())
        .limit(1)
        .single();

      if (!activeSub) {
        ownersToExpire.push(owner.id);
      }
    }

    // Batch update expired owners
    if (ownersToExpire.length > 0) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ status: "expired" })
        .in("id", ownersToExpire);

      if (updateError) {
        throw new Error(`Failed to update expired owners: ${updateError.message}`);
      }
    }

    const result = {
      success: true,
      processed: expiredOwners?.length ?? 0,
      expired: ownersToExpire.length,
      timestamp: new Date().toISOString(),
    };

    console.log("Trial expiration completed:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Trial expiration failed:", message);

    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
