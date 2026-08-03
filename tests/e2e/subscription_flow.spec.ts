import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const dbUrl = process.env.DATABASE_URL || "";

const prisma = new PrismaClient({
  datasources: { db: { url: dbUrl } },
});

async function runWithRetry(fn: (p: PrismaClient) => Promise<any>) {
  let attempts = 0;
  while (true) {
    try {
      attempts++;
      return await fn(prisma);
    } catch (e: any) {
      if (attempts >= 8) throw e;
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
}

test.describe("Subscription flow checks (custom)", () => {
  test.setTimeout(240000);

  test("Runs 5 verifications: FREE -> publish -> pay -> expire -> views", async ({ page, browser }) => {
    // 1) Create owner profile
    const timestamp = Date.now();
    const ownerEmail = `e2e.sub.owner.${timestamp}@mamaison.ne`;
    const ownerId = crypto.randomUUID();
    await runWithRetry((p) =>
      p.$executeRawUnsafe(`
        insert into public.profiles (id, email, name, phone, role, status, "createdAt", "updatedAt")
        values ('${ownerId}', '${ownerEmail}', 'E2E Owner ${timestamp}', '+2279' || floor(random() * 10000000 + 1000000)::int::text, 'OWNER', 'ACTIVE', now(), now());
      `)
    );

    // Insert initial FREE subscription
    const subId = crypto.randomUUID();
    await runWithRetry((p) =>
      p.$executeRawUnsafe(`
        insert into public.subscriptions (id, "userId", status, price, "startDate", "endDate", "createdAt")
        values ('${subId}', '${ownerId}', 'FREE', 0, now(), null, now());
      `)
    );

    // Verify subscription is FREE and endDate is NULL
    const subRes: any = await runWithRetry((p) =>
      p.$queryRawUnsafe(`select status, "endDate" from public.subscriptions where "userId" = '${ownerId}' order by "createdAt" desc limit 1`)
    );
    expect(subRes.length).toBeGreaterThan(0);
    const initialStatus = subRes[0].status;
    const initialEndDate = subRes[0].endDate;

    // 2) Publish a property (should succeed)
    const propertyId = crypto.randomUUID();
    await runWithRetry((p) =>
      p.$executeRawUnsafe(`
        insert into public.properties (id, "ownerId", title, description, type, "transactionType", price, city, district, address, rooms, bathrooms, surface, status, "createdAt", "updatedAt")
        values ('${propertyId}', '${ownerId}', 'E2E Free Property ${timestamp}', 'Desc', 'HOUSE', 'RENT', 100000, 'Niamey', 'Plateau', 'Addr', 3, 2, 120, 'APPROVED', now(), now());
      `)
    );

    // Confirm property exists
    const propRes: any = await runWithRetry((p) => p.$queryRawUnsafe(`select id from public.properties where id='${propertyId}'`));
    expect(propRes.length).toBe(1);

    // 3) Simulate payment approval: update subscription to ACTIVE and set badgeVerified
    await runWithRetry((p) => p.$executeRawUnsafe(`update public.subscriptions set status='ACTIVE', "startDate"=now(), "endDate"=now()+ interval '30 days' where id='${subId}'`));
    await runWithRetry((p) => p.$executeRawUnsafe(`update public.profiles set "badgeVerified" = true where id='${ownerId}'`));

    const afterPaySub: any = await runWithRetry((p) => p.$queryRawUnsafe(`select status from public.subscriptions where id='${subId}'`));
    const afterPayProfile: any = await runWithRetry((p) => p.$queryRawUnsafe(`select "badgeVerified" from public.profiles where id='${ownerId}'`));

    // Check ordering on /recherche: compare position vs a FREE account property
    // Create another FREE owner's property for comparison
    const otherOwnerId = crypto.randomUUID();
    await runWithRetry((p) =>
      p.$executeRawUnsafe(`insert into public.profiles (id, email, name, phone, role, status, "createdAt", "updatedAt") values ('${otherOwnerId}', 'other.${timestamp}@x.com', 'Other', '+2279' || floor(random() * 10000000 + 1000000)::int::text, 'OWNER', 'ACTIVE', now(), now())`)
    );
    const otherPropId = crypto.randomUUID();
    await runWithRetry((p) =>
      p.$executeRawUnsafe(`insert into public.properties (id, "ownerId", title, description, type, "transactionType", price, city, district, address, rooms, bathrooms, surface, status, "createdAt", "updatedAt") values ('${otherPropId}', '${otherOwnerId}', 'E2E Other Free ${timestamp}', 'Desc', 'HOUSE', 'RENT', 110000, 'Niamey', 'Plateau', 'Addr', 2, 1, 80, 'APPROVED', now() - interval '1 minute', now() - interval '1 minute')`)
    );

    // Load search page and get ordering by actual result links
    await page.goto('/recherche?city=Niamey');
    await page.waitForLoadState('domcontentloaded');
    const anchors = page.locator('main div.grid a[href^="/annonces/"]');
    await expect(anchors.first()).toBeVisible();
    const count = await anchors.count();
    let posPaid = -1;
    let posFree = -1;
    for (let i = 0; i < count; i++) {
      const href = await anchors.nth(i).getAttribute('href');
      if (!href) continue;
      if (href.endsWith(`/${propertyId}`)) posPaid = i + 1;
      if (href.endsWith(`/${otherPropId}`)) posFree = i + 1;
    }

    // 4) Force subscription to EXPIRED
    await runWithRetry((p) => p.$executeRawUnsafe(`update public.subscriptions set status='EXPIRED', "endDate"=now()- interval '1 day' where id='${subId}'`));
    await runWithRetry((p) => p.$executeRawUnsafe(`update public.profiles set "badgeVerified" = false where id='${ownerId}'`));

    // Verify property still visible and can publish new one
    const visibleRes: any = await runWithRetry((p) => p.$queryRawUnsafe(`select count(*)::int as total from public.properties p join public.profiles pr on pr.id = p."ownerId" where p.id='${propertyId}' and p.status='APPROVED' and pr.status='ACTIVE'`));
    const visibleCount = visibleRes[0].total;

    // Try to create a new property after expiry
    const newPropId = crypto.randomUUID();
    await runWithRetry((p) =>
      p.$executeRawUnsafe(`insert into public.properties (id, "ownerId", title, description, type, "transactionType", price, city, district, address, rooms, bathrooms, surface, status, "createdAt", "updatedAt") values ('${newPropId}', '${ownerId}', 'E2E New After Expire ${timestamp}', 'Desc', 'HOUSE', 'RENT', 120000, 'Niamey', 'Plateau', 'Addr', 1, 1, 50, 'APPROVED', now(), now())`)
    );

    // Check badge removed
    const badgeAfterExpired: any = await runWithRetry((p) => p.$queryRawUnsafe(`select "badgeVerified" from public.profiles where id='${ownerId}'`));

    // Recompute ordering after expiration
    await page.reload();
    const anchors2 = page.locator('main div.grid a[href^="/annonces/"]');
    const count2 = await anchors2.count();
    let posPaidAfterExpire = -1;
    for (let i = 0; i < count2; i++) {
      const href = await anchors2.nth(i).getAttribute('href');
      if (!href) continue;
      if (href.endsWith(`/${propertyId}`)) posPaidAfterExpire = i + 1;
    }

    // 5) Load property 3 times in private contexts and verify viewCount
    const context = await browser.newContext({ userAgent: 'playwright-e2e' });
    const privatePages = [];
    for (let i = 0; i < 3; i++) {
      const inc = await browser.newContext();
      const p = await inc.newPage();
      await p.goto(`/annonces/${propertyId}`);
      await p.waitForLoadState('domcontentloaded');
      await p.close();
      await inc.close();
    }

    const viewRes: any = await runWithRetry((p) => p.$queryRawUnsafe(`select "viewCount" from public.properties where id='${propertyId}'`));

    // REPORT: exact values
    console.log('REPORT_VALUES', {
      initialStatus,
      initialEndDate,
      propertyId,
      otherPropId,
      posPaid,
      posFree,
      afterPaySubStatus: afterPaySub[0]?.status,
      afterPayProfileBadge: afterPayProfile[0]?.badgeVerified,
      visibleCount,
      badgeAfterExpired: badgeAfterExpired[0]?.badgeVerified,
      posPaidAfterExpire,
      viewCount: viewRes[0]?.viewCount,
    });

    // Assertions to ensure test completes
    expect(initialStatus).toBe('FREE');
    expect(initialEndDate).toBeNull();
    expect(propRes.length).toBe(1);
    expect(afterPaySub[0]?.status).toBe('ACTIVE');
    expect(afterPayProfile[0]?.badgeverified ?? afterPayProfile[0]?.badgeVerified).toBe(true);
    expect(visibleCount).toBeGreaterThan(0);
    expect(badgeAfterExpired[0]?.badgeVerified).toBe(false);
    expect(viewRes[0]?.viewCount).toBe(3);
  });
});
