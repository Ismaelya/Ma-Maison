const { chromium } = require("@playwright/test");
const path = require("path");
const fs = require("fs");

const artifactDir = "C:\\Users\\ThinkPad\\.gemini\\antigravity-ide\\brain\\d7cf3fec-12a3-4907-97a0-d34046d51be0";

if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

async function getBrowser() {
  const chromePaths = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Users\\ThinkPad\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe"
  ];
  for (const p of chromePaths) {
    if (fs.existsSync(p)) {
      console.log("Using system Chrome at:", p);
      return await chromium.launch({ executablePath: p, headless: true });
    }
  }
  return await chromium.launch({ headless: true });
}

async function capture(page, url, fileName, delay = 2000, action = null) {
  try {
    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: "networkidle", timeout: 25000 }).catch(async () => {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 });
    });
    if (action) await action(page);
    await page.waitForTimeout(delay);
    const filePath = path.join(artifactDir, fileName);
    await page.screenshot({ path: filePath, fullPage: false });
    console.log(`✓ Saved ${fileName}`);
  } catch (err) {
    console.error(`✗ Failed to capture ${fileName}:`, err.message);
  }
}

async function main() {
  console.log("Starting capture process...");
  const browser = await getBrowser();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 850 },
  });
  const page = await context.newPage();

  // 1. Unauthenticated Auth Pages Logos
  console.log("--- Capturing Auth & Public Pages Logos ---");
  await capture(page, "http://localhost:3000/connexion", "logo_connexion_page.png", 1500);
  await capture(page, "http://localhost:3000/inscription", "logo_inscription_page.png", 1500);
  await capture(page, "http://localhost:3000/mot-de-passe-oublie", "logo_mot_de_passe_oublie.png", 1500);
  await capture(page, "http://localhost:3000/compte-suspendu", "logo_compte_suspendu.png", 1500);

  // 2. Public Homepage (Logo in Header & Footer, PropertyCard with Avatar)
  await capture(page, "http://localhost:3000/", "logo_public_header.png", 2000);
  
  // Footer logo capture (scroll to bottom)
  await capture(page, "http://localhost:3000/", "logo_public_footer.png", 1500, async (p) => {
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  });

  // Property Card with avatar
  await capture(page, "http://localhost:3000/", "property_card_avatar_8dcbf442.png", 2000, async (p) => {
    const card = await p.$('.property-card');
    if (card) {
      await card.scrollIntoViewIfNeeded();
    }
  });

  // 3. Property Detail Page (showing owner 8dcbf442 avatar)
  await capture(
    page,
    "http://localhost:3000/annonces/a0000001-0000-4000-8000-000000000000",
    "property_detail_avatar_8dcbf442.png",
    2500
  );

  // 4. Log in as user 8dcbf442 (test@example.com)
  console.log("--- Logging in as test@example.com (8dcbf442) ---");
  await page.goto("http://localhost:3000/connexion", { waitUntil: "domcontentloaded" });
  await page.fill('input[type="email"]', "test@example.com");
  await page.fill('input[type="password"]', "Password123!");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  // 5. Dashboard Layout Header (Avatar 8dcbf442 & Logo)
  await capture(page, "http://localhost:3000/dashboard", "dashboard_layout_avatar_8dcbf442.png", 2000);
  await capture(page, "http://localhost:3000/dashboard", "logo_dashboard_header.png", 2000);

  // 6. Public Header when logged in (Header Avatar 8dcbf442)
  await capture(page, "http://localhost:3000/", "header_avatar_8dcbf442.png", 2000);

  // 7. Mobile Nav when logged in (Mobile Nav Avatar 8dcbf442)
  console.log("Capturing Mobile Nav for logged in user...");
  try {
    const mobileContext = await browser.newContext({ viewport: { width: 375, height: 667 } });
    const cookies = await context.cookies();
    await mobileContext.addCookies(cookies);
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
    await mobilePage.waitForTimeout(1500);
    const menuBtn = await mobilePage.$('button[aria-label="Ouvrir le menu"]');
    if (menuBtn) {
      await menuBtn.click();
      await mobilePage.waitForTimeout(1000);
    }
    const mobilePath = path.join(artifactDir, "mobile_nav_avatar_8dcbf442.png");
    await mobilePage.screenshot({ path: mobilePath });
    console.log("✓ Saved mobile_nav_avatar_8dcbf442.png");
    await mobileContext.close();
  } catch (err) {
    console.error("✗ Failed mobile nav capture:", err.message);
  }

  // 8. ChatBox (Dashboard Messages with Avatar)
  await capture(
    page,
    "http://localhost:3000/dashboard/messages?conv=b195cab8-7dbe-4063-abf9-57d2c958e119",
    "chatbox_avatar_8dcbf442.png",
    3000
  );

  // 9. Admin Layout Header Logo
  await capture(page, "http://localhost:3000/admin", "logo_admin_header.png", 2000);

  await browser.close();
  console.log("=== ALL CAPTURES FINISHED SUCCESSFULLY ===");
}

main().catch(err => {
  console.error("Script error:", err);
  process.exit(1);
});
