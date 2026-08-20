import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function run() {
  const sqlPath = path.join(__dirname, '../supabase/migrations/009_upgrade_to_owner.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  console.log('Applying 009_upgrade_to_owner.sql to database...');
  await prisma.$executeRawUnsafe(sql);
  console.log('Migration applied successfully via Prisma raw SQL!');
  await prisma.$disconnect();
}

run().catch(async (e) => {
  console.error('Migration error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
