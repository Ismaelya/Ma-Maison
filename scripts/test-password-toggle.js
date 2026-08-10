const { chromium } = require('playwright');

async function testPasswordToggle() {
  console.log('=== TEST REEL 1 : BASCULEMENT MOT DE PASSE (EYE / EYEOFF) ===');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('1. Navigation vers https://ma-maison-niger.vercel.app/connexion...');
  await page.goto('https://ma-maison-niger.vercel.app/connexion', { waitUntil: 'networkidle' });

  const passwordInput = page.locator('input[name="password"]');
  await passwordInput.fill('MonMotDePasseSecret123');

  const initialType = await passwordInput.getAttribute('type');
  console.log('2. Type initial du champ mot de passe :', initialType);

  const toggleButton = page.locator('button[aria-label="Afficher le mot de passe"]');
  console.log('3. Clic sur le bouton œil (Afficher le mot de passe)...');
  await toggleButton.click();

  const typeAfterClick1 = await passwordInput.getAttribute('type');
  console.log('4. Type du champ après 1er clic :', typeAfterClick1);

  const hideButton = page.locator('button[aria-label="Masquer le mot de passe"]');
  console.log('5. Clic à nouveau sur le bouton œil (Masquer le mot de passe)...');
  await hideButton.click();

  const typeAfterClick2 = await passwordInput.getAttribute('type');
  console.log('6. Type du champ après 2e clic :', typeAfterClick2);

  await browser.close();

  const success = initialType === 'password' && typeAfterClick1 === 'text' && typeAfterClick2 === 'password';
  console.log('\n=== RÉSULTAT TEST 1 ===');
  console.log('Statut :', success ? '✅ PASSED (Basculement password -> text -> password validé)' : '❌ FAILED');
}

testPasswordToggle().catch(console.error);
