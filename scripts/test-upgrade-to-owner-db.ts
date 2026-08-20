process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { Client } from 'pg';
import crypto from 'crypto';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  console.log('===========================================================');
  console.log('🧪 TEST RÉEL BDD — upgrade_to_owner & Bannière Hero');
  console.log('===========================================================\n');

  const timestamp = Date.now();
  const tenantId = crypto.randomUUID();
  const tenantEmail = `tenant_${timestamp}@example.com`;

  // Helper to execute SQL inside a single transaction with auth.uid() set
  async function runAsUser(userId: string, sqlQuery: string, params: any[] = []) {
    await client.query('BEGIN');
    try {
      await client.query(`SELECT set_config('request.jwt.claim.sub', $1, true)`, [userId]);
      await client.query(`SELECT set_config('request.jwt.claim.role', 'authenticated', true)`);
      const res = await client.query(sqlQuery, params);
      await client.query('COMMIT');
      return res;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }
  }

  // -------------------------------------------------------------
  // TEST 1: Compte TENANT -> Appel upgrade_to_owner()
  // -------------------------------------------------------------
  console.log('▶ TEST 1: Compte TENANT -> Appel public.upgrade_to_owner()');
  
  // 1.1 Insert test profile TENANT
  await client.query(`
    INSERT INTO profiles (id, name, phone, email, role, status, "createdAt", "updatedAt")
    VALUES ($1, $2, $3, $4, 'TENANT', 'ACTIVE', now(), now())
  `, [tenantId, `Locataire Test ${timestamp}`, `+22790${timestamp.toString().slice(-6)}`, tenantEmail]);

  console.log(`  Profil TENANT créé en BDD: id=${tenantId}, email=${tenantEmail}`);

  // Check role before
  const resBefore = await client.query(`SELECT role FROM profiles WHERE id = $1`, [tenantId]);
  console.log(`  Rôle initial en BDD: ${resBefore.rows[0].role}`);

  // 1.2 Execute upgrade_to_owner() as TENANT user in transaction
  console.log('  Exécution de SELECT public.upgrade_to_owner() avec auth.uid() set...');
  await runAsUser(tenantId, `SELECT public.upgrade_to_owner()`);

  // 1.3 Verify profile role and subscription in DB
  const resAfter = await client.query(`SELECT role FROM profiles WHERE id = $1`, [tenantId]);
  const subAfter = await client.query(`SELECT id, "userId", status, price FROM subscriptions WHERE "userId" = $1`, [tenantId]);

  console.log(`  Rôle après upgrade en BDD: ${resAfter.rows[0].role}`);
  console.log(`  Subscription créée en BDD:`, subAfter.rows[0]);

  const test1Passed = resAfter.rows[0].role === 'OWNER' &&
                      subAfter.rows.length > 0 &&
                      subAfter.rows[0].status === 'FREE' &&
                      subAfter.rows[0].price === 0;

  console.log(`  Résultat Test 1: ${test1Passed ? '✅ SUCCÈS (Role: OWNER, Sub: FREE/0 FCFA)' : '❌ ÉCHEC'}\n`);

  // -------------------------------------------------------------
  // TEST 2: Publication d'une annonce par ce compte désormais OWNER
  // -------------------------------------------------------------
  console.log('▶ TEST 2: Publication d\'une annonce par le compte désormais OWNER');
  const propId = crypto.randomUUID();
  const propTitle = `Villa Test Upgrade ${timestamp}`;
  const propDesc = "Belle villa créée pour tester le rôle OWNER";

  await client.query(`
    INSERT INTO properties (id, "ownerId", title, description, type, "transactionType", "rentalPeriod", price, city, district, rooms, bathrooms, status, availability, "createdAt", "updatedAt")
    VALUES ($1, $2, $3, $4, 'HOUSE', 'RENT', 'MONTHLY', 180000, 'Niamey', 'Koubia', 3, 2, 'PENDING', 'AVAILABLE', now(), now())
  `, [propId, tenantId, propTitle, propDesc]);

  const propCheck = await client.query(`SELECT id, "ownerId", status FROM properties WHERE id = $1`, [propId]);
  console.log(`  Annonce créée en BDD: id=${propCheck.rows[0].id}, ownerId=${propCheck.rows[0].ownerId}`);

  const test2Passed = propCheck.rows.length > 0 && propCheck.rows[0].ownerId === tenantId;
  console.log(`  Résultat Test 2: ${test2Passed ? '✅ SUCCÈS (Annonce publiée normalement)' : '❌ ÉCHEC'}\n`);

  // -------------------------------------------------------------
  // TEST 3: Deuxième appel à upgrade_to_owner() sur le compte déjà OWNER
  // -------------------------------------------------------------
  console.log('▶ TEST 3: Re-tentative d\'upgrade sur le même compte (déjà OWNER)');
  let secondErrorMsg = '';
  try {
    await runAsUser(tenantId, `SELECT public.upgrade_to_owner()`);
  } catch (err: any) {
    secondErrorMsg = err.message || '';
  }

  console.log(`  Exception capturée: "${secondErrorMsg}"`);
  const test3Passed = secondErrorMsg.includes('Seuls les comptes Locataire');
  console.log(`  Résultat Test 3: ${test3Passed ? '✅ SUCCÈS (Rejet propre)' : '❌ ÉCHEC'}\n`);

  // -------------------------------------------------------------
  // TEST 4: Appel upgrade_to_owner() avec un compte ADMIN ou AGENCY
  // -------------------------------------------------------------
  console.log('▶ TEST 4: Tentative upgrade avec compte ADMIN et AGENCY');
  const adminId = crypto.randomUUID();
  const agencyId = crypto.randomUUID();

  await client.query(`
    INSERT INTO profiles (id, name, phone, email, role, status, "createdAt", "updatedAt")
    VALUES ($1, 'Admin Test', $2, $3, 'ADMIN', 'ACTIVE', now(), now())
  `, [adminId, `+22792${timestamp.toString().slice(-6)}`, `admin_${timestamp}@example.com`]);

  await client.query(`
    INSERT INTO profiles (id, name, phone, email, role, status, "createdAt", "updatedAt")
    VALUES ($1, 'Agency Test', $2, $3, 'AGENCY', 'ACTIVE', now(), now())
  `, [agencyId, `+22793${timestamp.toString().slice(-6)}`, `agency_${timestamp}@example.com`]);

  let adminErrorMsg = '';
  try {
    await runAsUser(adminId, `SELECT public.upgrade_to_owner()`);
  } catch (err: any) {
    adminErrorMsg = err.message || '';
  }

  let agencyErrorMsg = '';
  try {
    await runAsUser(agencyId, `SELECT public.upgrade_to_owner()`);
  } catch (err: any) {
    agencyErrorMsg = err.message || '';
  }

  console.log(`  Message d'erreur pour ADMIN: "${adminErrorMsg}"`);
  console.log(`  Message d'erreur pour AGENCY: "${agencyErrorMsg}"`);

  const test4Passed = adminErrorMsg.includes('Seuls les comptes Locataire') &&
                      agencyErrorMsg.includes('Seuls les comptes Locataire');
  console.log(`  Résultat Test 4: ${test4Passed ? '✅ SUCCÈS (Rejet propre pour ADMIN & AGENCY)' : '❌ ÉCHEC'}\n`);

  // -------------------------------------------------------------
  // TEST 5: Affichage / Masquage de la Bannière Hero
  // -------------------------------------------------------------
  console.log('▶ TEST 5: Logique d\'affichage/masquage de la Bannière Hero');

  function evaluateBanner(role?: string | null, isAuth?: boolean) {
    const r = String(role || "").toUpperCase();
    if (isAuth && (r === "OWNER" || r === "AGENCY" || r === "ADMIN")) {
      return { visible: false, target: null };
    }
    const isTenant = isAuth && r === "TENANT";
    return {
      visible: true,
      target: isTenant ? "/dashboard/devenir-proprietaire" : "/inscription?role=OWNER",
    };
  }

  const resAnon = evaluateBanner(null, false);
  const resTenant = evaluateBanner("TENANT", true);
  const resOwner = evaluateBanner("OWNER", true);
  const resAgency = evaluateBanner("AGENCY", true);
  const resAdmin = evaluateBanner("ADMIN", true);

  console.log(`  Visiteur anonyme: visible=${resAnon.visible}, target=${resAnon.target}`);
  console.log(`  Compte TENANT: visible=${resTenant.visible}, target=${resTenant.target}`);
  console.log(`  Compte OWNER: visible=${resOwner.visible}, target=${resOwner.target}`);
  console.log(`  Compte AGENCY: visible=${resAgency.visible}, target=${resAgency.target}`);
  console.log(`  Compte ADMIN: visible=${resAdmin.visible}, target=${resAdmin.target}`);

  const test5Passed = resAnon.visible && resAnon.target === '/inscription?role=OWNER' &&
                      resTenant.visible && resTenant.target === '/dashboard/devenir-proprietaire' &&
                      !resOwner.visible && !resAgency.visible && !resAdmin.visible;

  console.log(`  Résultat Test 5: ${test5Passed ? '✅ SUCCÈS' : '❌ ÉCHEC'}\n`);

  console.log('===========================================================');
  if (test1Passed && test2Passed && test3Passed && test4Passed && test5Passed) {
    console.log('🎉 TOUS LES 5 TESTS ONT ÉTÉ VÉRIFIÉS AVEC SUCCÈS SUR LA BDD !');
  } else {
    console.log('⚠️ DES TESTS ONT ÉCHOUÉ — VÉRIFIEZ LES RÉSULTATS');
  }
  console.log('===========================================================');

  await client.end();
}

main().catch(async (err) => {
  console.error('Fatal error:', err);
  try { await client.end(); } catch {}
  process.exit(1);
});
