#!/usr/bin/env node
/**
 * Apply migration via Supabase REST SQL endpoint
 * Uses the postgres_query RPC or falls back to individual function creation
 */
const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wvxojyoblzlvbedtorwq.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'wvxojyoblzlvbedtorwq';

if (!SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable; aborting to avoid exposing secrets.');
  process.exit(1);
}

// Try the Supabase Management API v1 endpoint for SQL execution
function execSqlViaManagementApi(sql) {
  return new Promise((resolve) => {
    const body = JSON.stringify({ query: sql });
    const req = https.request({
      hostname: 'api.supabase.com',
      path: `/v1/projects/${PROJECT_REF}/database/query`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('error', e => resolve({ status: 0, body: e.message }));
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('Applying migration 006 via Supabase...\n');

  // SQL statements to execute (split into individual statements)
  const statements = [
    // Drop old uuid-typed versions if they exist
    `DROP FUNCTION IF EXISTS public.has_active_subscription(uuid)`,
    `DROP FUNCTION IF EXISTS public.count_daily_messages(uuid)`,
    `DROP FUNCTION IF EXISTS public.has_active_subscription(text)`,
    `DROP FUNCTION IF EXISTS public.count_daily_messages(text)`,
    `DROP FUNCTION IF EXISTS public.get_conversation_participants(uuid)`,

    // Create has_active_subscription(text)
    `CREATE OR REPLACE FUNCTION public.has_active_subscription(p_user_id text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE "userId" = p_user_id
      AND status = 'ACTIVE'
  );
$$`,

    `REVOKE ALL ON FUNCTION public.has_active_subscription(text) FROM PUBLIC`,
    `GRANT EXECUTE ON FUNCTION public.has_active_subscription(text) TO authenticated`,

    // Create count_daily_messages(text)
    `CREATE OR REPLACE FUNCTION public.count_daily_messages(p_user_id text)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.messages
  WHERE "senderId" = p_user_id
    AND "createdAt" > now() - interval '24 hours'
$$`,

    `REVOKE ALL ON FUNCTION public.count_daily_messages(text) FROM PUBLIC`,
    `GRANT EXECUTE ON FUNCTION public.count_daily_messages(text) TO authenticated`,

    // Create get_conversation_participants(text)
    `CREATE OR REPLACE FUNCTION public.get_conversation_participants(p_conversation_id text)
RETURNS TABLE(tenant_id text, owner_id text)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT "tenantId", "ownerId"
  FROM public.conversations
  WHERE id = p_conversation_id
$$`,

    `REVOKE ALL ON FUNCTION public.get_conversation_participants(text) FROM PUBLIC`,
    `GRANT EXECUTE ON FUNCTION public.get_conversation_participants(text) TO authenticated`,
  ];

  let allOk = true;
  for (const stmt of statements) {
    const shortStmt = stmt.replace(/\n/g, ' ').substring(0, 60) + '...';
    const result = await execSqlViaManagementApi(stmt);
    if (result.status === 200) {
      console.log(`  ✅ ${shortStmt}`);
    } else {
      console.log(`  ❌ HTTP ${result.status}: ${result.body.substring(0, 100)}`);
      allOk = false;
    }
  }

  console.log('\n' + (allOk ? '✅ All statements applied!' : '⚠️  Some statements failed'));

  // Verify functions exist by querying RPC
  console.log('\n▶ Testing has_active_subscription with known Premium owner...');
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Test with the e2e owner who has ACTIVE sub
  const premiumUserId = '8a9bca5f-0343-4e23-b298-3253204b75b2';
  const { data: isPremium, error: rpcErr } = await admin.rpc('has_active_subscription', {
    p_user_id: premiumUserId
  });

  if (rpcErr) {
    console.log(`  ❌ RPC error: ${JSON.stringify(rpcErr)}`);
    console.log('     → Function may not be deployed yet');
  } else {
    console.log(`  has_active_subscription('${premiumUserId.substring(0,8)}...') = ${isPremium}`);
    if (isPremium === true) {
      console.log('  ✅ Function correctly identifies Premium OWNER!');
    } else {
      console.log('  ⚠️  Returned false — checking subscriptions directly...');
      const { data: subs } = await admin.from('subscriptions')
        .select('userId, status').eq('userId', premiumUserId).limit(5);
      console.log('  Raw subscriptions:', JSON.stringify(subs));
    }
  }

  // Test count_daily_messages
  const { data: count, error: countErr } = await admin.rpc('count_daily_messages', {
    p_user_id: premiumUserId
  });
  if (countErr) {
    console.log(`  ❌ count_daily_messages error: ${JSON.stringify(countErr)}`);
  } else {
    console.log(`  count_daily_messages = ${count} ✅`);
  }
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
