import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const anonClient = createClient(supabaseUrl, supabaseAnonKey);
const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

async function runDiagnostic() {
  console.log('=== STEP 1: All properties (especially APPROVED) ===');
  const properties: any = await prisma.$queryRaw`
    select id, title, status, "ownerId", "createdAt" from properties order by "createdAt" desc;
  `;
  console.log('Properties:', JSON.stringify(properties, null, 2));

  console.log('\n=== STEP 2 & 3: Owner Profiles & Subscriptions ===');
  const profiles: any = await prisma.$queryRaw`
    select id, email, role, status from profiles;
  `;
  console.log('Profiles:', JSON.stringify(profiles, null, 2));

  const subscriptions: any = await prisma.$queryRaw`
    select id, "userId", status, "endDate", "createdAt" from subscriptions order by "createdAt" desc;
  `;
  console.log('Subscriptions:', JSON.stringify(subscriptions, null, 2));

  console.log('\n=== STEP 4: Active RLS Policy properties_public_read in pg_policies ===');
  const policies: any = await prisma.$queryRaw`
    select policyname, tablename, roles, cmd, qual from pg_policies where policyname = 'properties_public_read';
  `;
  console.log('Active Policy in pg_policies:', JSON.stringify(policies, null, 2));

  console.log('\n=== STEP 5: Anon Client Query (mimicking /annonces) ===');
  const { data: anonProperties, error: anonError } = await anonClient
    .from('properties')
    .select('*, profiles(id, name, agencyName, badgeVerified, avatarUrl, phone, createdAt), property_images(url)')
    .eq('status', 'APPROVED');

  console.log('Anon Properties returned:', anonProperties?.map((p: any) => ({ id: p.id, title: p.title, status: p.status, ownerId: p.ownerId })));
  console.log('Anon Error if any:', anonError);

  const { data: anonAll, error: anonAllError } = await anonClient
    .from('properties')
    .select('id, title, status');
  console.log('Anon All properties returned without status filter:', anonAll);
  console.log('Anon All Error:', anonAllError);

  await prisma.$disconnect();
}

runDiagnostic().catch(console.error);
