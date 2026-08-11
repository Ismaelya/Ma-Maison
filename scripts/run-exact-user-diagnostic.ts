import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
const prisma = new PrismaClient();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const anonClient = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  // Fetch all APPROVED properties directly via SQL (service role level via Prisma)
  const approvedProperties: any[] = await prisma.$queryRaw`
    select id, title, status, "ownerId", "createdAt" from properties where status = 'APPROVED' order by "createdAt" desc;
  `;

  const allProperties: any[] = await prisma.$queryRaw`
    select id, title, status, "ownerId", "createdAt" from properties order by "createdAt" desc;
  `;

  console.log('=== STEP 1: APPROVED Properties ===');
  console.log(`Found ${approvedProperties.length} APPROVED properties out of ${allProperties.length} total properties:`);
  console.table(approvedProperties);

  for (const p of approvedProperties) {
    console.log(`\n==================================================`);
    console.log(`DIAGNOSTIC FOR PROPERTY: "${p.title}" (ID: ${p.id})`);
    console.log(`==================================================`);

    // STEP 1
    console.log(`1. Property details:`);
    console.log(`   id: ${p.id}`);
    console.log(`   title: ${p.title}`);
    console.log(`   status: ${p.status}`);
    console.log(`   ownerId: ${p.ownerId}`);
    console.log(`   createdAt: ${p.createdAt}`);

    // STEP 2: Owner profile
    const ownerArr: any[] = await prisma.$queryRaw`
      select id, email, role, status from profiles where id = ${p.ownerId};
    `;
    const owner = ownerArr[0] || null;
    console.log(`2. Owner Profile:`);
    console.log(owner);

    // STEP 3: Owner subscription
    const subs: any[] = await prisma.$queryRaw`
      select status, "endDate", "createdAt" from subscriptions where "userId" = ${p.ownerId} order by "createdAt" desc;
    `;
    console.log(`3. Owner Subscriptions:`);
    console.log(subs);

    // STEP 5: Test the exact query executed by PropertyRepository.search() via anon client
    console.log(`5. Testing exact query executed by /annonces & /recherche (PropertyRepository.search) as anon client:`);
    const { data: repoQueryResult, error: repoQueryError } = await anonClient
      .from("properties")
      .select("*, property_images(*), profiles!inner(id, name, agencyName, badgeVerified, avatarUrl, phone, status)")
      .eq("status", "APPROVED")
      .eq("profiles.status", "ACTIVE")
      .eq("id", p.id);

    console.log(`   Repo query returned ${repoQueryResult?.length || 0} results.`);
    if (repoQueryError) {
      console.log(`   Repo Query Error:`, repoQueryError);
    }
    if (repoQueryResult && repoQueryResult.length > 0) {
      console.log(`   SUCCESS: Listing IS returned by anon client query.`);
    } else {
      console.log(`   FAILURE: Listing IS NOT returned by anon client query!`);
      
      // Let's debug why it failed:
      // Test 5a: properties only
      const { data: pOnly, error: pErr } = await anonClient
        .from("properties")
        .select("id, title, status")
        .eq("id", p.id);
      console.log(`   Test 5a (properties only): returned ${pOnly?.length || 0} items. Error:`, pErr);

      // Test 5b: profiles join without !inner
      const { data: pLeft, error: pLeftErr } = await anonClient
        .from("properties")
        .select("id, title, profiles(id, name, status)")
        .eq("id", p.id);
      console.log(`   Test 5b (properties with profiles left join): returned`, pLeft, `Error:`, pLeftErr);

      // Test 5c: direct profile read via anon client
      const { data: profAnon, error: profErr } = await anonClient
        .from("profiles")
        .select("id, name, status")
        .eq("id", p.ownerId);
      console.log(`   Test 5c (direct profile query via anon): returned`, profAnon, `Error:`, profErr);
    }
  }

  // STEP 4: Check active RLS policy properties_public_read
  console.log(`\n==================================================`);
  console.log(`STEP 4: RLS Policy properties_public_read in pg_policies`);
  console.log(`==================================================`);
  const policies: any = await prisma.$queryRaw`
    select policyname, tablename, roles, cmd, qual from pg_policies where policyname = 'properties_public_read';
  `;
  console.log(policies);

  // Also check profiles RLS policies just in case
  const profilePolicies: any = await prisma.$queryRaw`
    select policyname, tablename, roles, cmd, qual from pg_policies where tablename = 'profiles';
  `;
  console.log(`Profiles RLS Policies:`, profilePolicies);

  await prisma.$disconnect();
}

main().catch(console.error);
