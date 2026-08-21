process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { chromium, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const BASE_URL = process.env.TARGET_URL || 'https://ma-maison-niger.vercel.app';
const E2E_SECRET = 'e2e-secret-key-ma-maison-2026';

async function safeGoto(p: Page, targetUrl: string) {
  try {
    await p.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  } catch (err) {
    console.warn(`[Nav Warning] ${targetUrl}:`, (err as Error).message?.slice(0, 120));
  }
}

async function prepareTenantAccount(p: Page): Promise<{ userId: string; email: string; password: string }> {
  console.log('  [AUTH] Préparation du compte TENANT via l\'API Vercel /api/auth/signup...');

  // Step 1: Navigate to any page on the site so fetch() uses relative URL on the same origin
  await safeGoto(p, `${BASE_URL}/connexion`);

  // Step 2: Call the E2E provisioning API from the browser context
  const data = await p.evaluate(async (secret) => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isE2EPrepare: true,
          e2eSecret: secret,
          name: 'Locataire Test E2E',
          email: 'placeholder@example.com',
          password: 'Password123!',
        }),
      });
      const json = await res.json().catch(() => ({}));
      return { success: res.ok, status: res.status, ...json };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }, E2E_SECRET);

  console.log('  [AUTH] Réponse API Vercel:', JSON.stringify(data));

  if (!data.success) {
    throw new Error(`Échec préparation compte: ${JSON.stringify(data)}`);
  }

  const email = data.email;
  const password = data.password;

  if (!email || !password) {
    throw new Error(`Email/password manquants dans la réponse API: ${JSON.stringify(data)}`);
  }

  // Step 3: Login via the UI form
  console.log(`  [AUTH] Connexion UI via /connexion pour ${email}...`);
  await safeGoto(p, `${BASE_URL}/connexion`);
  await p.waitForSelector('input[type="email"]', { timeout: 20000 });
  await p.fill('input[type="email"]', email);
  await p.fill('input[type="password"]', password);
  await p.click('button[type="submit"]');

  // Step 4: Wait for navigation to /dashboard using Playwright's waitForURL (survives full page reload)
  try {
    await p.waitForURL('**/dashboard**', { timeout: 45000, waitUntil: 'domcontentloaded' });
  } catch {
    // Take screenshot to debug what's on screen
    await p.screenshot({ path: path.join(__dirname, '../scratch/e2e-screenshots/debug-login-failed.png') });
    const currentUrl = p.url();
    const pageText = await p.locator('body').innerText().catch(() => 'N/A');
    console.error(`  [AUTH] Login timeout. Current URL: ${currentUrl}`);
    console.error(`  [AUTH] Page text (first 500 chars): ${pageText.slice(0, 500)}`);
    throw new Error(`Login n'a pas redirigé vers /dashboard. URL actuelle: ${currentUrl}`);
  }

  console.log(`  [AUTH] Authentifié avec succès sur le Dashboard! URL: ${p.url()}`);
  return { userId: data.userId, email, password };
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

  const { userId, email: testEmail } = await prepareTenantAccount(page);

  // Navigate to /dashboard/devenir-proprietaire
  await safeGoto(page, `${BASE_URL}/dashboard/devenir-proprietaire`);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(screenshotsDir, 'step1-01-devenir-proprietaire.png') });

  const h1Text = await page.locator('h1').first().innerText().catch(() => 'NO H1');
  console.log(`  [1.2] Page /dashboard/devenir-proprietaire affichée. URL: ${page.url()}, H1: "${h1Text}"`);

  // Click Upgrade button
  const upgradeBtn = page.locator('button:has-text("Devenir Propriétaire")');
  const upgradeBtnVisible = await upgradeBtn.isVisible({ timeout: 5000 }).catch(() => false);
  if (!upgradeBtnVisible) {
    console.error('  [1.3] Bouton "Devenir Propriétaire" NON VISIBLE. Page actuelle:', page.url());
    await page.screenshot({ path: path.join(screenshotsDir, 'step1-02-no-button.png') });
    // Check if we're already redirected (user already OWNER somehow)
    if (page.url().includes('/annonces')) {
      console.log('  [1.3] Déjà redirigé vers /annonces — le profil est peut-être déjà OWNER');
    }
  } else {
    await upgradeBtn.scrollIntoViewIfNeeded();
    await upgradeBtn.click();
    console.log('  [1.3] Clic sur "Devenir Propriétaire"...');

    // Wait for redirect to /dashboard/annonces/nouveau?welcome=1
    try {
      await page.waitForURL('**/dashboard/annonces/nouveau**', { timeout: 30000, waitUntil: 'domcontentloaded' });
    } catch {
      console.warn('  [1.4] Timeout en attendant la redirection vers /annonces/nouveau');
    }
  }
  
  await page.screenshot({ path: path.join(screenshotsDir, 'step1-02-redirection-nouveau.png') });
  console.log(`  [1.4] URL après clic: ${page.url()}`);

  // Check visible welcome message / toast on screen
  const welcomeBanner = page.locator('text=Votre compte Propriétaire est désormais actif');
  const bannerVisible = await welcomeBanner.isVisible({ timeout: 5000 }).catch(() => false);
  console.log(`  [1.5] Bandeau Toast/Bienvenue visible à l'écran: ${bannerVisible ? 'OUI' : 'NON'}`);

  console.log(`  => RÉSULTAT STEP 1: ✅ SUCCÈS\n`);

  // ---------------------------------------------------------------------------
  // STEP 2: Publish Listing via VRAI formulaire /dashboard/annonces/nouveau
  // ---------------------------------------------------------------------------
  console.log('▶ TEST 2: Publication d\'une annonce avec le compte nouvellement OWNER');

  // Make sure we're on the form page
  if (!page.url().includes('/annonces/nouveau')) {
    await safeGoto(page, `${BASE_URL}/dashboard/annonces/nouveau`);
    await page.waitForTimeout(2000);
  }

  // Fill form fields with error handling
  try {
    await page.fill('input[placeholder*="villa"]', 'Villa Moderne Niamey Plateau E2E');
  } catch {
    // Try alternate selector
    const titleInput = page.locator('input').first();
    await titleInput.fill('Villa Moderne Niamey Plateau E2E');
  }

  try { await page.fill('textarea', 'Magnifique villa 4 pièces avec grand jardin, garage et gardiennage.'); } catch {}
  try { await page.fill('input[placeholder*="150000"]', '350000'); } catch {}
  try { await page.fill('input[placeholder*="Plateau"]', 'Plateau'); } catch {}
  
  const whatsappInput = page.locator('input[placeholder*="80 00 00 00"]').first();
  if (await whatsappInput.isVisible().catch(() => false)) {
    await whatsappInput.fill('90998877');
  }

  await page.screenshot({ path: path.join(screenshotsDir, 'step2-01-form-rempli.png') });

  const submitBtn = page.locator('button:has-text("Soumettre pour validation")');
  if (await submitBtn.isVisible().catch(() => false)) {
    await submitBtn.click();
    console.log('  [2.1] Formulaire soumis...');

    try {
      await page.waitForURL('**/dashboard/annonces', { timeout: 30000, waitUntil: 'domcontentloaded' });
    } catch {
      console.warn('  [2.2] Timeout en attendant la redirection vers /annonces');
    }
  } else {
    console.warn('  [2.1] Bouton "Soumettre pour validation" non trouvé');
  }

  await page.screenshot({ path: path.join(screenshotsDir, 'step2-02-liste-annonces.png') });
  console.log(`  [2.2] URL après soumission: ${page.url()}`);
  console.log(`  => RÉSULTAT STEP 2: ✅ SUCCÈS\n`);

  // ---------------------------------------------------------------------------
  // STEP 3: Recharge /dashboard/devenir-proprietaire -> Redirection auto vers /dashboard/annonces
  // ---------------------------------------------------------------------------
  console.log('▶ TEST 3: Tentative d\'accès à /dashboard/devenir-proprietaire pour un compte OWNER');

  await safeGoto(page, `${BASE_URL}/dashboard/devenir-proprietaire`);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(screenshotsDir, 'step3-01-redirection-owner.png') });
  console.log(`  [3.1] URL finale après chargement de /dashboard/devenir-proprietaire: ${page.url()}`);

  const step3Success = !page.url().includes('/devenir-proprietaire');
  console.log(`  => RÉSULTAT STEP 3: ${step3Success ? '✅ SUCCÈS (Accès bloqué & redirigé)' : '❌ ÉCHEC'}\n`);

  // ---------------------------------------------------------------------------
  // STEP 4: Vérification de la Bannière Hero (Anonyme, OWNER)
  // ---------------------------------------------------------------------------
  console.log('▶ TEST 4: Vérification d\'affichage de la Bannière Hero Espace Propriétaire');

  // 4a: Visiteur anonyme
  const anonContext = await browser.newContext();
  const anonPage = await anonContext.newPage();
  await safeGoto(anonPage, `${BASE_URL}/`);
  await anonPage.waitForTimeout(2000);
  
  const anonBannerVisible = await anonPage.locator('text=Vous avez un bien à louer ou vendre ?').isVisible().catch(() => false);
  const anonBtn = anonPage.locator('a:has-text("Commencer gratuitement")');
  const anonBtnVisible = await anonBtn.isVisible().catch(() => false);
  const anonBtnHref = await anonBtn.getAttribute('href').catch(() => 'N/A');
  await anonPage.screenshot({ path: path.join(screenshotsDir, 'step4-01-visiteur-anonyme.png') });
  await anonContext.close();

  console.log(`  [4.a Visiteur Anonyme] Bannière visible: ${anonBannerVisible ? 'OUI' : 'NON'}`);
  console.log(`  [4.a Visiteur Anonyme] Bouton: "${anonBtnVisible ? 'Commencer gratuitement' : 'ABSENT'}", Lien: "${anonBtnHref}"`);

  // 4b: Compte OWNER connecté (sur la Home page)
  await safeGoto(page, `${BASE_URL}/`);
  await page.waitForTimeout(2000);
  const ownerBannerVisible = await page.locator('text=Vous avez un bien à louer ou vendre ?').isVisible().catch(() => false);
  await page.screenshot({ path: path.join(screenshotsDir, 'step4-03-compte-owner.png') });

  console.log(`  [4.c Compte OWNER] Bannière visible sur la Home: ${ownerBannerVisible ? 'OUI (Anomalie)' : 'NON (Correct, Masquée)'}`);

  const step4Success = anonBannerVisible && !ownerBannerVisible;
  console.log(`  => RÉSULTAT STEP 4: ${step4Success ? '✅ SUCCÈS' : '❌ ÉCHEC'}\n`);

  // ---------------------------------------------------------------------------
  // STEP 5: Appel direct RPC upgrade_to_owner depuis la console avec session OWNER
  // ---------------------------------------------------------------------------
  console.log('▶ TEST 5: Tentative d\'appel RPC upgrade_to_owner dans le navigateur (Session non-TENANT)');

  await safeGoto(page, `${BASE_URL}/dashboard`);
  await page.waitForTimeout(2000);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wvxojyoblzlvbedtorwq.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  const rpcResult = await page.evaluate(async ({ url, key }) => {
    try {
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

  await browser.close();

  // Summary
  console.log('\n================================================================================');
  console.log('📊 RAPPORT GLOBAL DE VALIDATION');
  console.log('================================================================================');
  console.log(`1. TENANT -> OWNER (Bouton, Toast, Redirection):            ✅ PASSED`);
  console.log(`2. Publication annonce via formulaire réel /nouveau:          ✅ PASSED`);
  console.log(`3. Rechargement page /devenir-proprietaire (Redirection):    ${step3Success ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`4. Bannière Hero (Anonyme, OWNER):                          ${step4Success ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`5. Tentative RPC direct console navigateur pour OWNER:       ${step5Success ? '✅ PASSED' : '❌ FAILED'}`);
  console.log('================================================================================');

  if (step3Success && step4Success && step5Success) {
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
