const { chromium } = require('playwright');

async function debugLoginNetwork() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('response', async res => {
    if (res.url().includes('/api/auth/login')) {
      console.log('<< RESPONSE STATUS /api/auth/login:', res.status());
      try {
        const json = await res.json();
        console.log('<< RESPONSE JSON /api/auth/login:', JSON.stringify(json, null, 2));
      } catch (e) {
        console.log('<< RESPONSE TEXT /api/auth/login:', await res.text());
      }
    }
  });

  console.log('1. Naviguer vers /connexion...');
  await page.goto('https://ma-maison-niger.vercel.app/connexion', { waitUntil: 'networkidle' });

  console.log('2. Remplir email et mot de passe...');
  await page.fill('input[type="email"]', 'ismaelyaoukdo@gmail.com');
  await page.fill('input[type="password"]', 'TestPassword123!');
  
  console.log('3. Clic sur le bouton de connexion et attente réponse API...');
  const [response] = await Promise.all([
    page.waitForResponse(res => res.url().includes('/api/auth/login')),
    page.click('button[type="submit"]')
  ]);

  console.log('4. Réponse API capturée ! Attente 5 secondes...');
  await page.waitForTimeout(5000);
  console.log('5. URL finale de la page :', page.url());

  await browser.close();
}

debugLoginNetwork().catch(console.error);
