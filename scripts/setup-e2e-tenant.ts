process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;
const USER_ID = 'c42a60a1-30a9-4859-b3f0-6ea3d67ed716';
const TEST_EMAIL = 'e2e_tenant_browser_test@example.com';

async function main() {
  console.log(`Setting up test TENANT account in DB...`);

  let attempts = 0;
  let client: Client | null = null;

  while (attempts < 5) {
    try {
      attempts++;
      console.log(`Attempt ${attempts} connecting to DB...`);
      client = new Client({ connectionString, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 });
      await client.connect();
      break;
    } catch (err: any) {
      console.warn(`Attempt ${attempts} failed: ${err.message}`);
      if (client) try { await client.end(); } catch {}
      if (attempts >= 5) throw err;
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  if (!client) throw new Error('Could not connect to DB');

  // Reset profile to TENANT
  await client.query(`
    INSERT INTO profiles (id, name, phone, email, role, status, "createdAt", "updatedAt")
    VALUES ($1, 'Locataire Test E2E', '+22790998877', $2, 'TENANT', 'ACTIVE', now(), now())
    ON CONFLICT (id) DO UPDATE SET role = 'TENANT', status = 'ACTIVE'
  `, [USER_ID, TEST_EMAIL]);

  // Clean subscriptions and properties for this user
  await client.query(`DELETE FROM properties WHERE "ownerId" = $1`, [USER_ID]);
  await client.query(`DELETE FROM subscriptions WHERE "userId" = $1`, [USER_ID]);

  await client.end();

  console.log('✅ Test TENANT account reset in DB!');
  console.log(`User ID: ${USER_ID}`);
  console.log(`Email: ${TEST_EMAIL}`);
}

main().catch(console.error);
