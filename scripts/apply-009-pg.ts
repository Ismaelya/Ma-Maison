process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

console.log('Connecting with pg Client to pooler on port 6543...');

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  console.log('Connected to Postgres DB!');

  const sqlPath = path.join(__dirname, '../supabase/migrations/009_upgrade_to_owner.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('Executing migration 009_upgrade_to_owner.sql...');
  await client.query(sql);
  console.log('✅ Migration 009 executed successfully!');

  await client.end();
}

main().catch(async (err) => {
  console.error('❌ Migration failed:', err);
  try { await client.end(); } catch {}
  process.exit(1);
});
