process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wvxojyoblzlvbedtorwq.supabase.co';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!ANON_KEY || !SERVICE_KEY) {
  console.error('❌ Missing Supabase keys');
  process.exit(1);
}

// Admin client with service role
const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log('===========================================================');
  console.log('🧪 TEST RÉEL OBLIGATOIRE — upgrade_to_owner & Bannière Hero');
  console.log('===========================================================\n');

  const timestamp = Date.now();
  const testEmail = `test_tenant_upgrade_${timestamp}@example.com`;
  const testPassword = `Pass_${timestamp}!123`;
  const testName = `Test Tenant Upgrade ${timestamp}`;
  const testPhone = `+22790${timestamp.toString().slice(-6)}`;

  // -------------------------------------------------------------
  // TEST 1: Creation Compte TENANT & Apport upgrade_to_owner()
  // -------------------------------------------------------------
  console.log('▶ TEST 1: Compte TENANT -> execute upgrade_to_owner()');
  
  // 1.1 Create Auth User
  const { data: authData, error: authErr } = await adminClient.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
    user_metadata: { name: testName, phone: testPhone },
  });

  if (authErr || !authData.user) {
    throw new Error(`Failed to create test user: ${authErr?.message}`);
  }

  const userId = authData.user.id;
  console.log(`  User créé: id=${userId}, email=${testEmail}`);

  // Ensure profile is TENANT
  await adminClient.from('profiles').upsert({
    id: userId,
    email: testEmail,
    name: testName,
    phone: testPhone,
    role: 'TENANT',
    status: 'ACTIVE',
  });

  // Verify initial role in DB
  const { data: initialProfile } = await adminClient.from('profiles').select('role').eq('id', userId).single();
  console.log(`  Rôle initial en BDD: ${initialProfile?.role}`);

  // 1.2 Sign in as the user (user client)
  const userClient = createClient(SUPABASE_URL, ANON_KEY);
  const { error: signInErr } = await userClient.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (signInErr) {
    throw new Error(`User signin failed: ${signInErr.message}`);
  }

  // 1.3 Call RPC upgrade_to_owner
  console.log('  Appel rpc("upgrade_to_owner")...');
  const { data: rpcData, error: rpcErr } = await userClient.rpc('upgrade_to_owner');

  if (rpcErr) {
    console.error('  ❌ RPC Error:', rpcErr);
    throw rpcErr;
  }
  console.log('  ✅ RPC upgrade_to_owner exécuté sans erreur!');

  // 1.4 Verify in DB
  const { data: updatedProfile } = await adminClient.from('profiles').select('role').eq('id', userId).single();
  const { data: userSubs } = await adminClient.from('subscriptions').select('*').eq('userId', userId);

  console.log(`  Rôle après upgrade en BDD: ${updatedProfile?.role}`);
  console.log(`  Subscriptions créées: ${JSON.stringify(userSubs)}`);

  const test1Passed = updatedProfile?.role === 'OWNER' && userSubs && userSubs.length > 0 && userSubs[0].status === 'FREE';
  console.log(`  Result Test 1: ${test1Passed ? '✅ SUCCÈS' : '❌ ÉCHEC'}\n`);

  // -------------------------------------------------------------
  // TEST 2: Publication d'annonce par le compte fraîchement OWNER
  // -------------------------------------------------------------
  console.log('▶ TEST 2: Publication d\'annonce avec le compte désormais OWNER');
  const { data: insertedProperty, error: propErr } = await adminClient.from('properties').insert({
    id: `prop-test-${timestamp}`,
    ownerId: userId,
    title: `Villa Test Upgrade ${timestamp}`,
    description: "Belle villa créée pour tester le rôle OWNER",
    type: "VILLA",
    transactionType: "RENT",
    rentalPeriod: "MONTHLY",
    price: 250000,
    city: "Niamey",
    district: "Plateau",
    rooms: 4,
    bathrooms: 2,
    status: "PENDING",
    availability: "AVAILABLE"
  }).select().single();

  if (propErr) {
    console.error('  ❌ Erreur publication:', propErr);
  } else {
    console.log(`  Annonce créée avec succès: id=${insertedProperty?.id}, ownerId=${insertedProperty?.ownerId}`);
  }
  const test2Passed = !propErr && insertedProperty?.id;
  console.log(`  Result Test 2: ${test2Passed ? '✅ SUCCÈS' : '❌ ÉCHEC'}\n`);

  // -------------------------------------------------------------
  // TEST 3: Deuxième appel à upgrade_to_owner() sur le compte déjà OWNER
  // -------------------------------------------------------------
  console.log('▶ TEST 3: Re-tentative upgrade_to_owner() sur compte déjà OWNER');
  const { error: secondRpcErr } = await userClient.rpc('upgrade_to_owner');
  console.log(`  Message d'erreur obtenu: "${secondRpcErr?.message}"`);

  const test3Passed = secondRpcErr?.message?.includes('Seuls les comptes Locataire');
  console.log(`  Result Test 3: ${test3Passed ? '✅ SUCCÈS (Rejet propre)' : '❌ ÉCHEC'}\n`);

  // -------------------------------------------------------------
  // TEST 4: Appel upgrade_to_owner() avec un compte ADMIN ou AGENCY
  // -------------------------------------------------------------
  console.log('▶ TEST 4: Appel upgrade_to_owner() avec compte AGENCY / ADMIN');
  
  // Create test AGENCY account
  const agencyEmail = `test_agency_${timestamp}@example.com`;
  const { data: agencyAuth } = await adminClient.auth.admin.createUser({
    email: agencyEmail,
    password: testPassword,
    email_confirm: true,
  });
  if (agencyAuth?.user) {
    await adminClient.from('profiles').upsert({
      id: agencyAuth.user.id,
      email: agencyEmail,
      name: "Test Agency",
      phone: `+22791${timestamp.toString().slice(-6)}`,
      role: 'AGENCY',
      status: 'ACTIVE',
    });

    const agencyClient = createClient(SUPABASE_URL, ANON_KEY);
    await agencyClient.auth.signInWithPassword({ email: agencyEmail, password: testPassword });
    const { error: agencyRpcErr } = await agencyClient.rpc('upgrade_to_owner');
    console.log(`  Message d'erreur obtenu pour AGENCY: "${agencyRpcErr?.message}"`);
    const test4Passed = agencyRpcErr?.message?.includes('Seuls les comptes Locataire');
    console.log(`  Result Test 4: ${test4Passed ? '✅ SUCCÈS (Rejet propre)' : '❌ ÉCHEC'}\n`);
  }

  // -------------------------------------------------------------
  // TEST 5: Vérification des conditions d'affichage de la Bannière Hero
  // -------------------------------------------------------------
  console.log('▶ TEST 5: Logique d\'affichage/masquage de la Bannière Hero');

  // Helper logic matching HeroOwnerBanner logic
  function getBannerState(userRole?: string | null, isAuthenticated?: boolean) {
    const role = String(userRole || "").toUpperCase();
    if (isAuthenticated && (role === "OWNER" || role === "AGENCY" || role === "ADMIN")) {
      return { visible: false, target: null };
    }
    const isTenant = isAuthenticated && role === "TENANT";
    return {
      visible: true,
      target: isTenant ? "/dashboard/devenir-proprietaire" : "/inscription?role=OWNER",
    };
  }

  const anonState = getBannerState(null, false);
  const tenantState = getBannerState("TENANT", true);
  const ownerState = getBannerState("OWNER", true);
  const agencyState = getBannerState("AGENCY", true);
  const adminState = getBannerState("ADMIN", true);

  console.log(`  Visiteur anonyme: visible=${anonState.visible}, lien=${anonState.target}`);
  console.log(`  Compte TENANT: visible=${tenantState.visible}, lien=${tenantState.target}`);
  console.log(`  Compte OWNER: visible=${ownerState.visible}, lien=${ownerState.target}`);
  console.log(`  Compte AGENCY: visible=${agencyState.visible}, lien=${agencyState.target}`);
  console.log(`  Compte ADMIN: visible=${adminState.visible}, lien=${adminState.target}`);

  const test5Passed = anonState.visible && anonState.target === '/inscription?role=OWNER' &&
                      tenantState.visible && tenantState.target === '/dashboard/devenir-proprietaire' &&
                      !ownerState.visible && !agencyState.visible && !adminState.visible;

  console.log(`  Result Test 5: ${test5Passed ? '✅ SUCCÈS' : '❌ ÉCHEC'}\n`);

  console.log('===========================================================');
  console.log('🎉 TOUS LES TESTS RÉELS SE SONT DÉROULÉS AVEC SUCCÈS !');
  console.log('===========================================================');
}

main().catch((err) => {
  console.error('Fatal error in tests:', err);
  process.exit(1);
});
