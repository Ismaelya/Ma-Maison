const { chromium } = require("@playwright/test");
const path = require("path");
const fs = require("fs");

const artifactDir = "C:\\Users\\ThinkPad\\.gemini\\antigravity-ide\\brain\\4a1b7ec2-d46f-406e-94d9-29a0595c3a29";

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

async function safeCapture(page, url, fileName, delay = 2000, action = null) {
  try {
    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    if (action) await action(page);
    await page.waitForTimeout(delay);
    const filePath = path.join(artifactDir, fileName);
    await page.screenshot({ path: filePath, fullPage: false });
    console.log(`Saved ${fileName} at ${filePath}`);
  } catch (err) {
    console.error(`Failed to capture ${fileName}:`, err.message);
  }
}

async function main() {
  console.log("Launching browser...");
  const browser = await getBrowser();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  // 1. Login Page Logo (Task 2)
  await safeCapture(page, "http://localhost:3000/connexion", "logo_login_page.png", 1500);

  // Perform Login as user 8dcbf442
  console.log("Logging in as test@example.com (user 8dcbf442)...");
  try {
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "Password123!");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
  } catch (err) {
    console.error("Login attempt error:", err.message);
  }

  // 2. Dashboard layout (Task 1 & Task 2)
  await safeCapture(page, "http://localhost:3000/dashboard", "dashboard_layout_avatar_and_logo.png", 2000);

  // 3. Public Header desktop (Task 1 & Task 2)
  await safeCapture(page, "http://localhost:3000/", "public_header_avatar_and_logo.png", 2000);

  // 4. Mobile Nav (Task 1)
  console.log("Capturing Mobile Nav...");
  try {
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 667 },
    });
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
    await mobilePage.screenshot({ path: path.join(artifactDir, "mobile_nav_avatar.png") });
    console.log("Saved mobile_nav_avatar.png");
    await mobileContext.close();
  } catch (err) {
    console.error("Failed mobile nav capture:", err.message);
  }

  // 5. PropertyCard (Task 1)
  console.log("Capturing PropertyCard...");
  try {
    await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    const cards = await page.$$('.property-card');
    if (cards.length > 0) {
      await cards[0].screenshot({ path: path.join(artifactDir, "property_card_avatar.png") });
      console.log("Saved property_card_avatar.png");
    } else {
      await page.screenshot({ path: path.join(artifactDir, "property_card_avatar.png") });
    }
  } catch (err) {
    console.error("Failed property card capture:", err.message);
  }

  // 6. Page détail annonce (Task 1)
  await safeCapture(page, "http://localhost:3000/annonces/a0000001-0000-4000-8000-000000000000", "property_detail_owner_avatar.png", 2000);

  // 7. ChatBox (Task 1)
  await safeCapture(page, "http://localhost:3000/dashboard/messages", "chatbox_avatar.png", 2500);

  // 8. Admin Layout Logo (Task 2)
  await safeCapture(page, "http://localhost:3000/admin", "logo_admin_layout.png", 2000);

  // 9. Suspended Account Page (Task 2)
  await safeCapture(page, "http://localhost:3000/compte-suspendu", "logo_suspended_account.png", 1500);

  await browser.close();
  console.log("ALL SCREENSHOTS PROCESS COMPLETED!");
}

main().catch((err) => {
  console.error("Error in main script:", err);
  process.exit(1);
});
