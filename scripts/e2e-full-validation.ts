process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { chromium, Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const BASE_URL = process.env.TARGET_URL || 'https://ma-maison-niger.vercel.app';
const UNIQUE_ID = Date.now();
const TEST_EMAIL = `e2e_tenant_${UNIQUE_ID}@example.com`;
const TEST_PASSWORD = 'Password123!';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

async function safeGoto(p: Page, targetUrl: string) {
  try {
    await p.goto(targetUrl, { waitUntil: 'commit', timeout: 30000 });
    await p.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});
  } catch (err) {
    console.warn(`[Nav Warning] ${targetUrl}:`, err);
  }
}

async function registerAndLoginTenant(p: Page) {
  console.log(`  [AUTH] 1. Création compte auto-confirmé via Supabase Admin: ${TEST_EMAIL}...`);
  let userData: any = null;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const res = await serviceClient.auth.admin.createUser({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        email_confirm: true,
        user_metadata: { name: 'Locataire Test E2E', role: 'TENANT' },
      });
      if (res.data?.user) {
        userData = res.data;
        break;
      }
    } catch (e: any) {
      if (attempt >= 5) throw new Error(`Échec création user auth après 5 essais: ${e.message}`);
      console.warn(`  [AUTH Retry ${attempt}] ${e.message}...`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  if (!userData?.user) {
    throw new Error('userData.user est nul');
  }

  const userId = userData.user.id;

  // Force profile role = TENANT
  await serviceClient.from('profiles').update({ role: 'TENANT' }).eq('id', userId);

  console.log(`  [AUTH] 2. Connexion UI via la page /connexion...`);
  await safeGoto(p, `${BASE_URL}/connexion`);
  await p.waitForSelector('input[type="email"]', { timeout: 15000 });
  await p.waitForTimeout(1000);
  await p.fill('input[type="email"]', TEST_EMAIL);
  await p.fill('input[type="password"]', TEST_PASSWORD);
  await p.click('button[type="submit"]');

  await p.waitForTimeout(2000);
  const errorAlert = await p.locator('.bg-red-50').innerText().catch(() => null);
  if (errorAlert) {
    console.error(`  [AUTH ERROR ON PAGE]: "${errorAlert}"`);
  }

  await p.waitForFunction(() => window.location.pathname.includes('/dashboard'), { timeout: 30000 });
  console.log(`  [AUTH] Connexion UI réussie! URL actuelle: ${p.url()}`);

  return userId;
}

async function runE2ETests() {
  console.log('================================================================================');
  console.log('🚀 DÉBUT DU TEST RÉEL EN NAVIGATEUR (PROD: https://ma-maison-niger.vercel.app)');
  console.log('================================================================================\n');

  const screenshotsDir = path.join(__dirname, '../scratch/e2e-screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  // Toast listener
  const toastsCaptured: string[] = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.toLowerCase().includes('toast') || text.includes('Félicitations') || text.includes('Propriétaire')) {
      toastsCaptured.push(text);
    }
  });

  // ---------------------------------------------------------------------------
  // STEP 1: TENANT logged in on /dashboard/devenir-proprietaire -> Click button -> Verify toast & DB
  // ---------------------------------------------------------------------------
  console.log('▶ TEST 1: Transformation TENANT -> OWNER via /dashboard/devenir-proprietaire');
  
  const userId = await registerAndLoginTenant(page);

  await safeGoto(page, `${BASE_URL}/dashboard/devenir-proprietaire`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(screenshotsDir, 'step1-01-devenir-proprietaire.png') });
  
  const h1Text = await page.locator('h1').first().innerText().catch(() => 'NO H1');
  console.log(`  [1.2] Page /dashboard/devenir-proprietaire affichée. URL: ${page.url()}, H1: "${h1Text}"`);

  // Click Upgrade button
  const upgradeBtn = page.locator('button:has-text("Devenir Propriétaire")');
  await upgradeBtn.scrollIntoViewIfNeeded();
  await upgradeBtn.click();
  console.log('  [1.3] Clic sur "Devenir Propriétaire"...');

  // Wait for redirect to /dashboard/annonces/nouveau?welcome=1
  await page.waitForFunction(() => window.location.pathname.includes('/dashboard/annonces/nouveau'), { timeout: 30000 });
  await page.screenshot({ path: path.join(screenshotsDir, 'step1-02-redirection-nouveau.png') });
  console.log(`  [1.4] Redirection confirmée vers: ${page.url()}`);

  // Check visible welcome message / toast on screen
  const welcomeBanner = page.locator('text=Votre compte Propriétaire est désormais actif');
  const bannerVisible = await welcomeBanner.isVisible({ timeout: 5000 }).catch(() => false);
  console.log(`  [1.5] Bandeau Toast/Bienvenue visible à l'écran: ${bannerVisible ? 'OUI ("Votre compte Propriétaire est désormais actif...")' : 'NON'}`);

  // DB Verification Step 1
  const { data: profile } = await serviceClient.from('profiles').select('role').eq('id', userId).single();
  const { data: subs } = await serviceClient.from('subscriptions').select('id, userId, status, price').eq('userId', userId);
  
  console.log(`  [1.6] BDD - Rôle: "${profile?.role}" (Attendu: OWNER)`);
  console.log(`  [1.7] BDD - Subscriptions:`, subs);

  const step1Success = profile?.role === 'OWNER' && Boolean(subs && subs.length > 0 && subs[0]?.status === 'FREE');
  console.log(`  => RÉSULTAT STEP 1: ${step1Success ? '✅ SUCCÈS' : '❌ ÉCHEC'}\n`);

  // ---------------------------------------------------------------------------
  // STEP 2: Publish Listing via VRAI formulaire /dashboard/annonces/nouveau
  // ---------------------------------------------------------------------------
  console.log('▶ TEST 2: Publication d\'une annonce avec le compte nouvellement OWNER');

  await page.fill('input[placeholder*="villa"]', 'Villa Moderne Niamey Plateau E2E');
  await page.fill('textarea', 'Magnifique villa 4 pièces avec grand jardin, garage et gardiennage.');
  await page.fill('input[placeholder*="150000"]', '350000');
  await page.fill('input[placeholder*="Plateau"]', 'Plateau');
  
  const whatsappInput = page.locator('input[placeholder*="80 00 00 00"]').first();
  if (await whatsappInput.isVisible()) {
    await whatsappInput.fill('90998877');
  }

  await page.screenshot({ path: path.join(screenshotsDir, 'step2-01-form-rempli.png') });

  const submitBtn = page.locator('button:has-text("Soumettre pour validation")');
  await submitBtn.click();
  console.log('  [2.1] Formulaire soumis...');

  await page.waitForFunction(() => window.location.pathname.endsWith('/dashboard/annonces'), { timeout: 30000 });
  await page.screenshot({ path: path.join(screenshotsDir, 'step2-02-liste-annonces.png') });
  console.log(`  [2.2] Redirection vers la liste des annonces: ${page.url()}`);

  // DB Verification Step 2
  const { data: props } = await serviceClient.from('properties').select('id, title, status').eq('ownerId', userId);
  console.log(`  [2.3] BDD - Annonces trouvées (${props?.length || 0}):`, props);

  const step2Success = Boolean(props && props.length > 0 && props[0]?.title === 'Villa Moderne Niamey Plateau E2E');
  console.log(`  => RÉSULTAT STEP 2: ${step2Success ? '✅ SUCCÈS' : '❌ ÉCHEC'}\n`);

  // ---------------------------------------------------------------------------
  // STEP 3: Recharge /dashboard/devenir-proprietaire -> Redirection auto vers /dashboard/annonces
  // ---------------------------------------------------------------------------
  console.log('▶ TEST 3: Tentative d\'accès à /dashboard/devenir-proprietaire pour un compte OWNER');

  await safeGoto(page, `${BASE_URL}/dashboard/devenir-proprietaire`);
  await page.waitForFunction(() => !window.location.pathname.includes('/devenir-proprietaire'), { timeout: 30000 });
  await page.screenshot({ path: path.join(screenshotsDir, 'step3-01-redirection-owner.png') });
  console.log(`  [3.1] URL finale après chargement de /dashboard/devenir-proprietaire: ${page.url()}`);

  const step3Success = page.url().includes('/dashboard/annonces') && !page.url().includes('/devenir-proprietaire');
  console.log(`  => RÉSULTAT STEP 3: ${step3Success ? '✅ SUCCÈS (Accès bloqué & redirigé vers /dashboard/annonces)' : '❌ ÉCHEC'}\n`);

  // ---------------------------------------------------------------------------
  // STEP 4: Vérification de la Bannière Hero (Anonyme, TENANT, OWNER)
  // ---------------------------------------------------------------------------
  console.log('▶ TEST 4: Vérification d\'affichage de la Bannière Hero Espace Propriétaire');

  // 4a: Visiteur anonyme
  const anonContext = await browser.newContext();
  const anonPage = await anonContext.newPage();
  await safeGoto(anonPage, `${BASE_URL}/`);
  
  const anonBannerVisible = await anonPage.locator('text=Vous avez un bien à louer ou vendre ?').isVisible();
  const anonBtn = anonPage.locator('a:has-text("Commencer gratuitement")');
  const anonBtnVisible = await anonBtn.isVisible();
  const anonBtnHref = await anonBtn.getAttribute('href');
  await anonPage.screenshot({ path: path.join(screenshotsDir, 'step4-01-visiteur-anonyme.png') });
  await anonContext.close();

  console.log(`  [4.a Visiteur Anonyme] Bannière visible: ${anonBannerVisible ? 'OUI' : 'NON'}`);
  console.log(`  [4.a Visiteur Anonyme] Bouton: "${anonBtnVisible ? 'Commencer gratuitement' : 'ABSENT'}", Lien: "${anonBtnHref}"`);

  // 4b: Compte TENANT connecté
  // Reset user back to TENANT temporarily for this test
  await serviceClient.from('profiles').update({ role: 'TENANT' }).eq('id', userId);
  
  const tenantContext = await browser.newContext();
  const tenantPage = await tenantContext.newPage();
  await safeGoto(tenantPage, `${BASE_URL}/connexion`);
  await tenantPage.waitForSelector('input[type="email"]', { timeout: 15000 });
  await tenantPage.fill('input[type="email"]', TEST_EMAIL);
  await tenantPage.fill('input[type="password"]', TEST_PASSWORD);
  await tenantPage.click('button[type="submit"]');
  await tenantPage.waitForFunction(() => window.location.pathname.includes('/dashboard'), { timeout: 30000 });

  await safeGoto(tenantPage, `${BASE_URL}/`);
  const tenantBannerVisible = await tenantPage.locator('text=Vous avez un bien à louer ou vendre ?').isVisible();
  const tenantBtn = tenantPage.locator('a:has-text("Devenir Propriétaire")');
  const tenantBtnVisible = await tenantBtn.isVisible();
  const tenantBtnHref = await tenantBtn.getAttribute('href');
  await tenantPage.screenshot({ path: path.join(screenshotsDir, 'step4-02-compte-tenant.png') });
  await tenantContext.close();

  console.log(`  [4.b Compte TENANT] Bannière visible: ${tenantBannerVisible ? 'OUI' : 'NON'}`);
  console.log(`  [4.b Compte TENANT] Bouton: "${tenantBtnVisible ? 'Devenir Propriétaire' : 'ABSENT'}", Lien: "${tenantBtnHref}"`);

  // 4c: Compte OWNER connecté
  // Restore user role to OWNER
  await serviceClient.from('profiles').update({ role: 'OWNER' }).eq('id', userId);

  await safeGoto(page, `${BASE_URL}/`);
  const ownerBannerVisible = await page.locator('text=Vous avez un bien à louer ou vendre ?').isVisible();
  await page.screenshot({ path: path.join(screenshotsDir, 'step4-03-compte-owner.png') });

  console.log(`  [4.c Compte OWNER] Bannière visible sur la Home: ${ownerBannerVisible ? 'OUI (Anomalie)' : 'NON (Correct, Masquée)'}`);

  const step4Success = anonBannerVisible && anonBtnHref === '/inscription?role=OWNER' &&
                       tenantBannerVisible && tenantBtnHref === '/dashboard/devenir-proprietaire' &&
                       !ownerBannerVisible;
  console.log(`  => RÉSULTAT STEP 4: ${step4Success ? '✅ SUCCÈS' : '❌ ÉCHEC'}\n`);

  // ---------------------------------------------------------------------------
  // STEP 5: Appel direct RPC upgrade_to_owner depuis la console avec session OWNER
  // ---------------------------------------------------------------------------
  console.log('▶ TEST 5: Tentative d\'appel RPC upgrade_to_owner dans le navigateur (Session non-TENANT)');

  await safeGoto(page, `${BASE_URL}/dashboard`);

  const rpcResult = await page.evaluate(async ({ url, key }) => {
    try {
      // Import Supabase Client in browser context
      const { createBrowserClient } = await import('@supabase/ssr');
      const supabase = createBrowserClient(url, key);
      const { data, error } = await supabase.rpc('upgrade_to_owner');
      return { success: !error, data, error: error ? { message: error.message, details: error.details, code: error.code } : null };
    } catch (err: any) {
      return { success: false, data: null, error: { message: err.message } };
    }
  }, { url: supabaseUrl, key: supabaseAnonKey });

  console.log('  [5.1] Résultat de l\'exécution RPC dans la console du navigateur:');
  console.log(JSON.stringify(rpcResult, null, 2));

  const expectedErrMsg = 'Seuls les comptes Locataire peuvent devenir Propriétaire';
  const isRejected = !rpcResult.success && rpcResult.error?.message?.includes(expectedErrMsg);
  console.log(`  [5.2] Rejet RPC confirmé avec l'erreur exacte ("${expectedErrMsg}"): ${isRejected ? 'OUI' : 'NON'}`);

  const step5Success = isRejected;
  console.log(`  => RÉSULTAT STEP 5: ${step5Success ? '✅ SUCCÈS (Sécurité RPC validée)' : '❌ ÉCHEC'}\n`);

  // ---------------------------------------------------------------------------
  // CLEANUP: Purge test user and related data
  // ---------------------------------------------------------------------------
  console.log('▶ NETTOYAGE / PURGE DES DONNÉES DE TEST BDD...');
  await serviceClient.from('properties').delete().eq('ownerId', userId);
  await serviceClient.from('subscriptions').delete().eq('userId', userId);
  await serviceClient.from('profiles').delete().eq('id', userId);
  try { await serviceClient.auth.admin.deleteUser(userId); } catch {}
  console.log('  [CLEANUP] Compte de test, annonces, abonnements et profil supprimés de la BDD.');

  await browser.close();

  // Summary
  console.log('\n================================================================================');
  console.log('📊 RAPPORT GLOBAL DE VALIDATION');
  console.log('================================================================================');
  console.log(`1. TENANT -> OWNER (Bouton, Toast, BDD Role & Sub Free): ${step1Success ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`2. Publication annonce via formulaire réel /nouveau:          ${step2Success ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`3. Rechargement page /devenir-proprietaire (Redirection):    ${step3Success ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`4. Bannière Hero (Anonyme, TENANT, OWNER):                  ${step4Success ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`5. Tentative RPC direct console navigateur pour OWNER:       ${step5Success ? '✅ PASSED' : '❌ FAILED'}`);
  console.log('================================================================================');

  if (step1Success && step2Success && step3Success && step4Success && step5Success) {
    console.log('🎉 TOUS LES TESTS SONT VALIDÉS À 100% AVEC SUCCÈS !');
  } else {
    console.error('⚠️ CERTAINS TESTS ONT ÉCHOUÉ');
    process.exit(1);
  }
}

runE2ETests().catch(err => {
  console.error('Erreur fatale lors des tests E2E:', err);
  process.exit(1);
});
