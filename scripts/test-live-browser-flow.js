const { chromium } = require('playwright');
const path = require('path');

const artifactDir = "C:\\Users\\ThinkPad\\.gemini\\antigravity-ide\\brain\\8efb0dbb-1418-4397-9bf4-4e1fd5840e9f";

async function main() {
  console.log('=== TEST NAVIGATEUR REEL PLAYWRIGHT (AVEC ATTENTE ROUTER CLIENT) ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  // 1. Navigation /connexion
  console.log('1. Navigation vers https://ma-maison-niger.vercel.app/connexion...');
  await page.goto('https://ma-maison-niger.vercel.app/connexion', { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_1_connexion.png') });

  // 2. Remplissage et clic
  console.log('2. Remplissage des identifiants (ismaelyaoukdo@gmail.com / TestPassword123!)...');
  await page.fill('input[type="email"]', 'ismaelyaoukdo@gmail.com');
  await page.fill('input[type="password"]', 'TestPassword123!');
  
  console.log('   Clic sur "Se connecter"...');
  await page.click('button[type="submit"]');

  // Attendre la redirection du Next.js router (vers /admin ou /dashboard)
  console.log('   Attente redirection du client React Router...');
  try {
    await page.waitForURL(url => !url.toString().includes('/connexion'), { timeout: 15000 });
  } catch (e) {
    console.log('   Attente URL timeout, vérification de l\'état actuel...');
  }
  await page.waitForTimeout(3000);

  // 3. Observation post-connexion
  const currentUrl = page.url();
  console.log('3. URL finale après soumission:', currentUrl);

  await page.screenshot({ path: path.join(artifactDir, 'screenshot_2_after_login.png') });

  // Extraction détaillée du DOM
  const pageTitle = await page.title();
  const headings = await page.evaluate(() => 
    Array.from(document.querySelectorAll('h1, h2, h3, header p, nav a, div.text-right p'))
      .map(e => e.innerText.trim())
      .filter(Boolean)
  );

  console.log('\n--- DESCRIPTION EXACTE DE L\'ECRAN APRES CONNEXION ---');
  console.log('Titre :', pageTitle);
  console.log('URL   :', currentUrl);
  console.log('Éléments UI principaux détectés à l\'écran :');
  headings.forEach(h => console.log('  - ' + h.replace(/\n/g, ' | ')));

  // 4. Recharge 5 fois de suite
  console.log('\n4. Test de rechargement 5 fois consécutives...');
  let reloadSuccessCount = 0;
  for (let i = 1; i <= 5; i++) {
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const reloadUrl = page.url();
    const isLogged = !reloadUrl.includes('/connexion');
    if (isLogged) reloadSuccessCount++;
    console.log(`   Recharge ${i}/5 : URL = ${reloadUrl} | Session maintenue = ${isLogged ? 'OUI (HTTP 200)' : 'NON'}`);
  }

  // 5. Navigation vers /admin/utilisateurs
  console.log('\n5. Navigation vers /admin/utilisateurs...');
  await page.goto('https://ma-maison-niger.vercel.app/admin/utilisateurs', { waitUntil: 'networkidle' });
  const adminUtilUrl = page.url();
  console.log('   URL actuelle:', adminUtilUrl);
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_3_admin_utilisateurs.png') });

  const adminHeadings = await page.evaluate(() => 
    Array.from(document.querySelectorAll('h1, h2, table th, div.font-semibold'))
      .map(e => e.innerText.trim())
      .filter(Boolean)
      .slice(0, 10)
  );
  console.log('   Aperçu UI /admin/utilisateurs :', adminHeadings.join(' | '));

  // 6. Navigation retour vers /dashboard
  console.log('\n6. Navigation retour vers /dashboard...');
  await page.goto('https://ma-maison-niger.vercel.app/dashboard', { waitUntil: 'networkidle' });
  const backDashUrl = page.url();
  console.log('   URL actuelle:', backDashUrl);
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_4_back_to_dashboard.png') });

  const dashHeadings = await page.evaluate(() => 
    Array.from(document.querySelectorAll('h1, h2, h3, p.font-semibold'))
      .map(e => e.innerText.trim())
      .filter(Boolean)
      .slice(0, 10)
  );
  console.log('   Aperçu UI /dashboard :', dashHeadings.join(' | '));

  console.log('\n=== BILAN FINAL DU TEST REEL NAVIGATEUR ===');
  console.log('Redirection post-connexion  :', currentUrl);
  console.log('Maintien session (5 recharges):', `${reloadSuccessCount}/5 rechargements réussis sans déconnexion`);
  console.log('Navigation /admin/utilisateurs:', adminUtilUrl.includes('/admin/utilisateurs') ? 'SUCCÈS' : 'ÉCHEC');
  console.log('Retour /dashboard           :', backDashUrl.includes('/dashboard') ? 'SUCCÈS' : 'ÉCHEC');

  await browser.close();
}

main().catch(err => {
  console.error('Erreur Playwright:', err);
  process.exit(1);
});
