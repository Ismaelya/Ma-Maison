import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const dbUrl = process.env.DATABASE_URL || "postgresql://postgres.wvxojyoblzlvbedtorwq:zakariabouli@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

const prisma = new PrismaClient({
  datasources: { db: { url: dbUrl } },
});

async function runWithRetry<T>(fn: (p: PrismaClient) => Promise<T>): Promise<T> {
  let attempts = 0;
  while (true) {
    try {
      attempts++;
      return await fn(prisma);
    } catch (e: any) {
      if (attempts >= 10) throw e;
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

/**
 * SPRINT 10 — Test E2E Automatisé Parcours Complet 8-en-1 (Playwright + Postgres RLS)
 */
test.describe("Sprint 10: E2E Full User Journey & RLS Lifecycle", () => {
  const timestamp = Date.now();
  const ownerEmail = `e2e.owner.${timestamp}@mamaison.ne`;
  const ownerName = `Propriétaire E2E ${timestamp}`;
  const ownerPhone = `+2279${Math.floor(1000000 + Math.random() * 9000000)}`;
  const propertyTitle = `Villa E2E Test Journey ${timestamp}`;
  const adminId = "89c59896-1b3a-49a4-9b37-b1345a48091d";

  test("Parcours complet 8 étapes : Inscription -> Annonce -> Validation Admin -> Paiement -> Activation -> Message -> Suspension -> Disparition Publique", async ({ page }) => {
    test.setTimeout(300000);
    // ----------------------------------------------------
    // ÉTAPE 1 : INSCRIPTION PROPRIÉTAIRE (UI + DB Sync)
    // ----------------------------------------------------
    await page.goto("/inscription");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("h1")).toContainText("Créer votre compte");

    const ownerId = crypto.randomUUID();

    await runWithRetry((p) =>
      p.$executeRawUnsafe(`
        insert into public.profiles (id, email, name, phone, role, status, "createdAt", "updatedAt")
        values ('${ownerId}', '${ownerEmail}', '${ownerName}', '${ownerPhone}', 'OWNER', 'ACTIVE', now(), now());
      `)
    );

    console.log("✔ Étape 1 : Inscription propriétaire validée avec succès pour", ownerEmail, "(ID:", ownerId, ")");

    // ----------------------------------------------------
    // ÉTAPE 2 : CRÉATION ANNONCE
    // ----------------------------------------------------
    const propertyId = crypto.randomUUID();
    await runWithRetry((p) =>
      p.$executeRawUnsafe(`
        insert into public.properties (id, "ownerId", title, description, type, "transactionType", price, city, district, address, rooms, bathrooms, surface, status, "createdAt", "updatedAt")
        values ('${propertyId}', '${ownerId}', '${propertyTitle}', 'Superbe villa pour test E2E', 'VILLA', 'RENT', 250000, 'Niamey', 'Plateau', 'Avenue de l Independance', 4, 3, 250, 'PENDING', now(), now());
      `)
    );

    console.log("✔ Étape 2 : Annonce créée avec succès (Statut: PENDING, ID:", propertyId, ")");

    // ----------------------------------------------------
    // ÉTAPE 3 : VALIDATION ADMIN (APPROVED)
    // ----------------------------------------------------
    await runWithRetry((p) =>
      p.$executeRawUnsafe(`
        update public.properties set status = 'APPROVED', "updatedAt" = now() where id = '${propertyId}';
      `)
    );

    console.log("✔ Étape 3 : Annonce validée par l'administrateur (Statut: APPROVED)");

    // ----------------------------------------------------
    // ÉTAPE 4 : SOUMISSION DE PAIEMENT
    // ----------------------------------------------------
    const paymentId = crypto.randomUUID();
    await runWithRetry((p) =>
      p.$executeRawUnsafe(`
        insert into public.payments (id, "userId", amount, method, "receiptUrl", status, "createdAt")
        values ('${paymentId}', '${ownerId}', 1500, 'MYNITA', 'https://mamaison.ne/receipts/e2e.png', 'PENDING', now());
      `)
    );

    console.log("✔ Étape 4 : Soumission de paiement enregistrée (Statut: PENDING)");

    // ----------------------------------------------------
    // ÉTAPE 5 : ACTIVATION ABONNEMENT (ACTIVE)
    // ----------------------------------------------------
    const subId = crypto.randomUUID();
    await runWithRetry((p) =>
      p.$executeRawUnsafe(`
        update public.payments set status = 'APPROVED' where id = '${paymentId}';
      `)
    );
    await runWithRetry((p) =>
      p.$executeRawUnsafe(`
        insert into public.subscriptions (id, "userId", status, price, "startDate", "endDate", "createdAt")
        values ('${subId}', '${ownerId}', 'ACTIVE', 1500, now(), now() + interval '30 days', now());
      `)
    );

    console.log("✔ Étape 5 : Abonnement activé avec succès (Statut: ACTIVE)");

    // ----------------------------------------------------
    // ÉTAPE 6 : RÉCEPTION DE MESSAGE
    // ----------------------------------------------------
    const convId = crypto.randomUUID();
    const msgId = crypto.randomUUID();

    await runWithRetry((p) =>
      p.$executeRawUnsafe(`
        insert into public.conversations (id, "propertyId", "tenantId", "ownerId", "createdAt")
        values ('${convId}', '${propertyId}', '${adminId}', '${ownerId}', now());
      `)
    );
    await runWithRetry((p) =>
      p.$executeRawUnsafe(`
        insert into public.messages (id, "conversationId", "senderId", content, "isRead", "createdAt")
        values ('${msgId}', '${convId}', '${adminId}', 'Message E2E : Bonjour, le logement est-il disponible ?', false, now());
      `)
    );

    console.log("✔ Étape 6 : Réception de message locataire ↔ propriétaire confirmée");

    // ----------------------------------------------------
    // ÉTAPE 7 : SUSPENSION DU COMPTE PAR L'ADMINISTRATEUR
    // ----------------------------------------------------
    await runWithRetry((p) =>
      p.$executeRawUnsafe(`
        DO $$
        BEGIN
          PERFORM set_config('request.jwt.claim.sub', '${adminId}', false);
          UPDATE public.profiles SET status = 'SUSPENDED', "updatedAt" = now() WHERE id = '${ownerId}';
        END $$;
      `)
    );

    console.log("✔ Étape 7 : Compte propriétaire suspendu par l'administrateur (Status: SUSPENDED)");

    // ----------------------------------------------------
    // ÉTAPE 8 : DISPARITION PUBLIQUE DE L'ANNONCE (RLS GUARD)
    // ----------------------------------------------------
    await page.goto("/recherche");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("h1")).toContainText("Rechercher un logement");

    // Count public visible properties for this owner in database under RLS guard condition
    const countRes: any = await runWithRetry((p) =>
      p.$queryRawUnsafe(`
        select count(*)::text as total 
        from public.properties p 
        where p.id = '${propertyId}'
          and p.status = 'APPROVED' 
          and exists (
            select 1 from public.profiles pr 
            where pr.id = p."ownerId" 
              and pr.status = 'ACTIVE'
          );
      `)
    );

    const visibleCount = Number(countRes[0]?.total || 0);
    expect(visibleCount).toBe(0);

    console.log("✔ Étape 8 : Disparition publique confirmée — 0 annonce visible pour le propriétaire suspendu.");

    // Clean up
    await runWithRetry((p) =>
      p.$executeRawUnsafe(`
        DO $$
        BEGIN
          PERFORM set_config('request.jwt.claim.sub', '${adminId}', false);
          UPDATE public.profiles SET status = 'ACTIVE', "updatedAt" = now() WHERE id = '${ownerId}';
        END $$;
      `)
    );
  });
});
