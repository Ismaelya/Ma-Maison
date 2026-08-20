process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { chromium } from '@playwright/test';
import { Client } from 'pg';
import path from 'path';
import fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const BASE_URL = process.env.TARGET_URL || 'https://ma-maison-niger.vercel.app';
const TEST_EMAIL = 'e2e_tenant_browser_test@example.com';
const TEST_PASSWORD = 'Password123!';
const USER_ID = 'c42a60a1-30a9-4859-b3f0-6ea3d67ed716';

const connectionString = process.env.DATABASE_URL;

async function queryDb(sql: string, params: any[] = []) {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const res = await client.query(sql, params);
  await client.end();
  return res.rows;
}

async function main() {
  console.log('===========================================================');
  console.log('🌐 TEST RÉEL EN NAVIGATEUR (Playwright + DB Check)');
  console.log(`Target URL: ${BASE_URL}`);
  console.log('===========================================================\n');

  // Launch Chromium Browser in headless mode
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const screenshotsDir = path.join(__dirname, '../scratch/e2e-screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // -------------------------------------------------------------
  // STEP 1: Log in TENANT -> Navigate to /dashboard/devenir-proprietaire -> Click upgrade
  // -------------------------------------------------------------
  console.log('▶ STEP 1: Connexion compte TENANT -> /dashboard/devenir-proprietaire -> Upgrade');
  
  await page.goto(`${BASE_URL}/connexion`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.fill('input[type="password"]', TEST_PASSWORD);
  await page.click('button[type="submit"]', { noWaitAfter: true });

  await page.waitForURL(url => url.pathname.includes('/dashboard'), { timeout: 20000 });
  console.log(`  Connecté avec succès! URL actuelle: ${page.url()}`);

  // Navigate to /dashboard/devenir-proprietaire
  await page.goto(`${BASE_URL}/dashboard/devenir-proprietaire`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('h1', { timeout: 15000 });
  await page.screenshot({ path: path.join(screenshotsDir, 'step1-devenir-proprietaire-page.png') });
  console.log('  Page /dashboard/devenir-proprietaire chargée.');

  // Click "Devenir Propriétaire" button
  console.log('  Clic sur le bouton "Devenir Propriétaire"...');
  const upgradeBtn = page.locator('button:has-text("Devenir Propriétaire")').last();
  await upgradeBtn.click({ noWaitAfter: true });

  // Wait for redirection to /dashboard/annonces/nouveau
  await page.waitForURL(url => url.pathname.includes('/dashboard/annonces/nouveau'), { timeout: 20000 });
  await page.screenshot({ path: path.join(screenshotsDir, 'step1-redirected-nouveau-page.png') });
  console.log(`  Redirigé vers: ${page.url()}`);

  // Verify Toast / Welcome Banner on screen
  const welcomeTextVisible = await page.locator('text=Votre compte Propriétaire est désormais actif').isVisible();
  console.log(`  Bandeau de bienvenue visible à l'écran: ${welcomeTextVisible ? 'OUI' : 'NON'}`);

  // DB Verification Step 1
  const dbProfiles = await queryDb('SELECT id, email, role FROM profiles WHERE id = $1', [USER_ID]);
  const dbSubs = await queryDb('SELECT id, "userId", status, price FROM subscriptions WHERE "userId" = $1', [USER_ID]);

  console.log(`  DB Check - Rôle profil: ${dbProfiles[0]?.role}`);
  console.log(`  DB Check - Subscription:`, dbSubs[0]);

  const step1Passed = dbProfiles[0]?.role === 'OWNER' && dbSubs[0]?.status === 'FREE' && dbSubs[0]?.price === 0;
  console.log(`  Résultat STEP 1: ${step1Passed ? '✅ SUCCÈS (Role: OWNER, Sub: FREE)' : '❌ ÉCHEC'}\n`);

  // -------------------------------------------------------------
  // STEP 2: Publish Listing via VRAI formulaire /dashboard/annonces/nouveau
  // -------------------------------------------------------------
  console.log('▶ STEP 2: Publication d\'annonce via le formulaire réel');

  await page.fill('input[placeholder*="villa"]', 'Superbe Villa F4 Plateau Niamey');
  await page.fill('textarea', 'Villa meublée avec jardin, garage et sécurité 24h/24.');
  await page.fill('input[placeholder*="150000"]', '250000');
  await page.fill('input[placeholder*="Plateau"]', 'Plateau');
  
  // WhatsApp
  const whatsappInput = page.locator('input[placeholder*="80 00 00 00"]').first();
  if (await whatsappInput.isVisible()) {
    await whatsappInput.fill('90998877');
  }

  await page.screenshot({ path: path.join(screenshotsDir, 'step2-filled-form.png') });

  // Submit form
  console.log('  Soumission du formulaire d\'annonce...');
  const submitBtn = page.locator('button:has-text("Soumettre pour validation")');
  await submitBtn.click({ noWaitAfter: true });

  await page.waitForURL(url => url.pathname.endsWith('/dashboard/annonces'), { timeout: 20000 });
  await page.screenshot({ path: path.join(screenshotsDir, 'step2-annonces-list.png') });
  console.log(`  Annonce soumise avec succès! URL: ${page.url()}`);

  // DB Verification Step 2
  const dbProps = await queryDb('SELECT id, title, status FROM properties WHERE "ownerId" = $1', [USER_ID]);
  console.log(`  DB Check - Annonce créée en BDD: id=${dbProps[0]?.id}, title="${dbProps[0]?.title}"`);

  const step2Passed = dbProps.length > 0;
  console.log(`  Résultat STEP 2: ${step2Passed ? '✅ SUCCÈS' : '❌ ÉCHEC'}\n`);

  // -------------------------------------------------------------
  // STEP 3: Recharge /dashboard/devenir-proprietaire (Compte désormais OWNER)
  // -------------------------------------------------------------
  console.log('▶ STEP 3: Tentative d\'accès à /dashboard/devenir-proprietaire pour un compte OWNER');
  await page.goto(`${BASE_URL}/dashboard/devenir-proprietaire`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForURL(url => !url.pathname.includes('/devenir-proprietaire'), { timeout: 15000 });
  console.log(`  Redirigé automatiquement! URL finale: ${page.url()}`);
  await page.screenshot({ path: path.join(screenshotsDir, 'step3-owner-redirect.png') });

  const step3Passed = !page.url().includes('/devenir-proprietaire');
  console.log(`  Résultat STEP 3: ${step3Passed ? '✅ SUCCÈS (Accès refusé & redirigé)' : '❌ ÉCHEC'}\n`);

  // -------------------------------------------------------------
  // STEP 4: Test d'affichage de la Bannière Hero
  // -------------------------------------------------------------
  console.log('▶ STEP 4: Test de la Bannière Hero (Anonyme, TENANT, OWNER)');

  // 4.1 Compte OWNER connecté (page actuelle)
  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const ownerBannerVisible = await page.locator('text=Vous avez un bien à louer ou vendre ?').isVisible();
  console.log(`  Compte OWNER connecté - Bannière visible sur la home page: ${ownerBannerVisible ? 'OUI (Anomalie)' : 'NON (Correct, Masquée)'}`);

  // 4.2 Visiteur Anonyme (nouveau contexte sans cookies)
  const anonContext = await browser.newContext();
  const anonPage = await anonContext.newPage();
  await anonPage.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const anonBannerVisible = await anonPage.locator('text=Vous avez un bien à louer ou vendre ?').isVisible();
  const anonBtnHref = await anonPage.getAttribute('a:has-text("Commencer gratuitement")', 'href');
  console.log(`  Visiteur Anonyme - Bannière visible: ${anonBannerVisible ? 'OUI' : 'NON'}, Lien bouton: ${anonBtnHref}`);
  await anonPage.screenshot({ path: path.join(screenshotsDir, 'step4-anon-banner.png') });
  await anonContext.close();

  const step4Passed = !ownerBannerVisible && anonBannerVisible && anonBtnHref?.includes('/inscription?role=OWNER');
  console.log(`  Résultat STEP 4: ${step4Passed ? '✅ SUCCÈS' : '❌ ÉCHEC'}\n`);

  // -------------------------------------------------------------
  // STEP 5: Tentative d'appel RPC upgrade_to_owner depuis le navigateur pour compte OWNER
  // -------------------------------------------------------------
  console.log('▶ STEP 5: Tentative d\'appel RPC upgrade_to_owner depuis le navigateur');
  
  const rpcResult = await page.evaluate(async () => {
    try {
      const { createBrowserClient } = await import('@supabase/ssr');
      const supabaseUrl = 'https://wvxojyoblzlvbedtorwq.supabase.co';
      const supabaseAnonKey = 'sb_publishable_a1ER7sJx5Apvn-sc0-ZIrA_HtuJsVL1';
      
      const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
      const { data, error } = await supabase.rpc('upgrade_to_owner');
      return { success: !error, error: error?.message || null };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  console.log(`  Résultat de l'appel RPC depuis la console du navigateur:`, rpcResult);
  const step5Passed = !rpcResult.success && rpcResult.error?.includes('Seuls les comptes Locataire');
  console.log(`  Résultat STEP 5: ${step5Passed ? '✅ SUCCÈS (Rejet RPC confirmé dans le navigateur)' : '❌ ÉCHEC'}\n`);

  // -------------------------------------------------------------
  // CLEANUP: Purge test data
  // -------------------------------------------------------------
  console.log('▶ NETTOYAGE DES DONNÉES DE TEST DE LA BDD...');
  await queryDb('DELETE FROM properties WHERE "ownerId" = $1', [USER_ID]);
  await queryDb('DELETE FROM subscriptions WHERE "userId" = $1', [USER_ID]);
  await queryDb('DELETE FROM profiles WHERE id = $1', [USER_ID]);
  await queryDb('DELETE FROM auth.users WHERE id = $1', [USER_ID]);
  console.log('  ✅ Compte de test et annonces nettoyés de la BDD avec succès.');

  await browser.close();

  console.log('\n===========================================================');
  if (step1Passed && step2Passed && step3Passed && step4Passed && step5Passed) {
    console.log('🎉 TOUS LES 5 TESTS EN NAVIGATEUR ET BDD ONT RÉUSSI !');
  } else {
    console.log('⚠️ DES TESTS ONT ÉCHOUÉ — VÉRIFIEZ LE RAPPORT');
  }
  console.log('===========================================================');
}

main().catch((err) => {
  console.error('Fatal error in E2E browser runner:', err);
  process.exit(1);
});
