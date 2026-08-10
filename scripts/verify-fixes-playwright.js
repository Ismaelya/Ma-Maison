const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  console.log('=== TEST PLAYWRIGHT REEL 1 : COMPTE ADMIN (ismaelyaoukdo@gmail.com) ===');
  
  // Assurer que l'utilisateur tenant de test existe
  const tenantEmail = 'test.tenant.validation@mamaison.ne';
  const tenantPassword = 'TestPassword123!';
  
  const { data: tenantAuth, error: tenantAuthErr } = await supabase.auth.admin.createUser({
    email: tenantEmail,
    password: tenantPassword,
    email_confirm: true,
  });

  let tenantUserId = tenantAuth?.user?.id;
  if (tenantAuthErr) {
    const { data: usersList } = await supabase.auth.admin.listUsers();
    const existing = usersList?.users.find(u => u.email === tenantEmail);
    if (existing) tenantUserId = existing.id;
  }

  if (tenantUserId) {
    await supabase.from('profiles').upsert({
      id: tenantUserId,
      email: tenantEmail,
      name: 'Locataire Test Validation',
      phone: '+22799998877',
      role: 'TENANT',
      status: 'ACTIVE'
    });
    console.log('✅ Compte TENANT de test préparé (id:', tenantUserId, ')');
  }

  const browser = await chromium.launch({ headless: true });

  // TEST 1 : ADMIN
  console.log('\n--- EXÉCUTION TEST 1 : ADMIN ---');
  const context1 = await browser.newContext(); // Contexte incognito neutre 100% frais
  const page1 = await context1.newPage();

  let adminApiResponse = null;

  page1.on('response', async res => {
    if (res.url().includes('/api/auth/login')) {
      try {
        adminApiResponse = await res.json();
      } catch (e) {}
    }
  });

  await page1.goto('https://ma-maison-niger.vercel.app/connexion', { waitUntil: 'networkidle' });
  await page1.fill('input[type="email"]', 'ismaelyaoukdo@gmail.com');
  await page1.fill('input[type="password"]', 'TestPassword123!');
  
  await Promise.all([
    page1.waitForURL(url => !url.toString().includes('/connexion'), { timeout: 15000 }).catch(() => {}),
    page1.click('button[type="submit"]')
  ]);

  await page1.waitForTimeout(3000);
  const adminFinalUrl = page1.url();

  console.log('1. Réponse JSON de /api/auth/login pour ADMIN :');
  console.log(JSON.stringify(adminApiResponse, null, 2));
  console.log('2. URL finale atteinte :', adminFinalUrl);
  console.log('3. Contenu profile.role de l\'API :', adminApiResponse?.profile?.role);
  console.log('4. Redirection directe vers /admin :', adminFinalUrl.includes('/admin') ? 'OUI (SUCCÈS)' : 'NON (ÉCHEC)');

  await context1.close();

  // TEST 2 : TENANT
  console.log('\n--- EXÉCUTION TEST 2 : TENANT ---');
  const context2 = await browser.newContext(); // Contexte incognito neutre 100% frais
  const page2 = await context2.newPage();

  let tenantApiResponse = null;

  page2.on('response', async res => {
    if (res.url().includes('/api/auth/login')) {
      try {
        tenantApiResponse = await res.json();
      } catch (e) {}
    }
  });

  await page2.goto('https://ma-maison-niger.vercel.app/connexion', { waitUntil: 'networkidle' });
  await page2.fill('input[type="email"]', tenantEmail);
  await page2.fill('input[type="password"]', tenantPassword);

  await Promise.all([
    page2.waitForURL(url => !url.toString().includes('/connexion'), { timeout: 15000 }).catch(() => {}),
    page2.click('button[type="submit"]')
  ]);

  await page2.waitForTimeout(3000);
  const tenantFinalUrl = page2.url();

  console.log('1. Réponse JSON de /api/auth/login pour TENANT :');
  console.log(JSON.stringify(tenantApiResponse, null, 2));
  console.log('2. URL finale atteinte :', tenantFinalUrl);
  console.log('3. Contenu profile.role de l\'API :', tenantApiResponse?.profile?.role);
  console.log('4. Redirection vers /dashboard :', tenantFinalUrl.includes('/dashboard') ? 'OUI (SUCCÈS)' : 'NON (ÉCHEC)');

  await context2.close();
  await browser.close();

  console.log('\n=== RÉSUMÉ DE VALIDATION DES TESTS ===');
  const adminOk = adminApiResponse?.profile?.role === 'ADMIN' && adminFinalUrl.includes('/admin');
  const tenantOk = tenantApiResponse?.profile?.role === 'TENANT' && tenantFinalUrl.includes('/dashboard');

  console.log('Statut Test Admin  :', adminOk ? '✅ PASSED (profile.role = ADMIN -> /admin)' : '❌ FAILED');
  console.log('Statut Test Tenant :', tenantOk ? '✅ PASSED (profile.role = TENANT -> /dashboard)' : '❌ FAILED');
}

main().catch(err => {
  console.error('Erreur test validation:', err);
  process.exit(1);
});
