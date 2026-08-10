const { chromium } = require('playwright');

async function runDiagnostic() {
  console.log('=== DIAGNOSTIC RESEAU & AUTHENTIFICATION EN PRODUCTION ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleLogs = [];
  const networkLogs = [];

  page.on('console', msg => {
    consoleLogs.push(`[Console ${msg.type()}] ${msg.text()}`);
  });

  page.on('pageerror', err => {
    consoleLogs.push(`[PageError] ${err.message}`);
  });

  let loginResponseData = null;

  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/api/auth/login')) {
      const status = response.status();
      const headers = response.headers();
      let bodyText = '';
      try {
        bodyText = await response.text();
      } catch (e) {
        bodyText = `Failed to read text: ${e.message}`;
      }
      loginResponseData = {
        url,
        status,
        headers,
        bodyText
      };
      networkLogs.push(`[Response /api/auth/login] Status: ${status}`);
    }
  });

  try {
    console.log('1. Chargement de https://ma-maison-niger.vercel.app/connexion...');
    await page.goto('https://ma-maison-niger.vercel.app/connexion', { waitUntil: 'networkidle' });

    console.log('2. Soumission des identifiants (ismaelyaoukdo@gmail.com)...');
    await page.fill('input[type="email"]', 'ismaelyaoukdo@gmail.com');
    await page.fill('input[type="password"]', 'TestPassword123!');

    await page.click('button[type="submit"]');

    console.log('3. Attente du traitement et des redirections (6s)...');
    await page.waitForTimeout(6000);

    const finalUrl = page.url();
    const cookies = await context.cookies();

    console.log('\n================ RESULTATS DU DIAGNOSTIC ================');
    console.log('\n--- 1. POST /api/auth/login ---');
    if (loginResponseData) {
      console.log('Code HTTP Status:', loginResponseData.status);
      console.log('Corps JSON Réponse:', loginResponseData.bodyText);
      console.log('Set-Cookie Headers:', loginResponseData.headers['set-cookie'] || 'Aucun header Set-Cookie dans la réponse API');
    } else {
      console.log('❌ Aucune réponse capturée pour /api/auth/login (la requête n\'a peut-être pas été envoyée ou a échoué)');
    }

    console.log('\n--- 2. URL Finale d\'Atterrissage ---');
    console.log('URL Finale:', finalUrl);

    console.log('\n--- 3. Erreurs Console ---');
    if (consoleLogs.length === 0) {
      console.log('Aucune erreur console détectée.');
    } else {
      consoleLogs.forEach(log => console.log(log));
    }

    console.log('\n--- 4. Cookies de Session (Application -> Cookies) ---');
    console.log('Nombre de cookies:', cookies.length);
    if (cookies.length === 0) {
      console.log('Cookies "sb-": ABSENTS');
    } else {
      cookies.forEach(c => console.log(`- Cookie: ${c.name} | Domain: ${c.domain} | Path: ${c.path} | Secure: ${c.secure} | SameSite: ${c.sameSite}`));
      const sbCookie = cookies.find(c => c.name.startsWith('sb-'));
      console.log('Statut Cookie Supabase ("sb-"):', sbCookie ? `PRÉSENT (${sbCookie.name})` : 'ABSENT');
    }

  } catch (err) {
    console.error('Erreur durant le diagnostic:', err);
  } finally {
    await browser.close();
  }
}

runDiagnostic();
