import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
const prisma = new PrismaClient();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const anonClient = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const properties: any[] = await prisma.$queryRaw`
    select id, title, status, "ownerId", "createdAt" from properties order by "createdAt" desc;
  `;
  console.log(`TOTAL PROPERTIES IN DB: ${properties.length}\n`);

  for (const p of properties) {
    const ownerArr: any[] = await prisma.$queryRaw`
      select id, email, role, status from profiles where id = ${p.ownerId};
    `;
    const owner = ownerArr[0] || null;

    const subs: any[] = await prisma.$queryRaw`
      select id, status, "endDate", "createdAt" from subscriptions where "userId" = ${p.ownerId} order by "createdAt" desc;
    `;

    const { data: anonResult } = await anonClient
      .from('properties')
      .select('id, title, status')
      .eq('id', p.id);

    const isVisibleToAnon = Array.isArray(anonResult) && anonResult.length > 0;

    console.log(`--- PROPERTY: "${p.title}" ---`);
    console.log(`  ID: ${p.id}`);
    console.log(`  Property Status: ${p.status}`);
    console.log(`  Owner ID: ${p.ownerId}`);
    console.log(`  Created At: ${p.createdAt}`);
    console.log(`  Owner Profile:`, owner);
    console.log(`  Owner Subscriptions (latest 2):`, subs.slice(0, 2));
    console.log(`  Visible via Anon Client (RLS): ${isVisibleToAnon}`);
    console.log('');
  }

  const policies: any = await prisma.$queryRaw`
    select policyname, tablename, roles, cmd, qual from pg_policies where policyname = 'properties_public_read';
  `;
  console.log('--- RLS POLICY properties_public_read ---');
  console.log(JSON.stringify(policies, null, 2));

  await prisma.$disconnect();
}

main().catch(console.error);
