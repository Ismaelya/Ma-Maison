import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
const prisma = new PrismaClient();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const anonClient = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const approvedProperties: any[] = await prisma.$queryRaw`
    select id, title, status, "ownerId", "createdAt" from properties where status = 'APPROVED' order by "createdAt" desc;
  `;

  console.log(`=== SUMMARY OF ALL ${approvedProperties.length} APPROVED PROPERTIES ===\n`);

  const summary = [];

  for (const p of approvedProperties) {
    const ownerArr: any[] = await prisma.$queryRaw`
      select id, email, role, status from profiles where id = ${p.ownerId};
    `;
    const owner = ownerArr[0] || null;

    const subs: any[] = await prisma.$queryRaw`
      select status, "endDate", "createdAt" from subscriptions where "userId" = ${p.ownerId} order by "createdAt" desc limit 1;
    `;
    const sub = subs[0] || null;

    // Direct RLS check on properties (properties_public_read policy: status='APPROVED' AND is_active_owner(ownerId))
    const { data: rlsProperty } = await anonClient
      .from("properties")
      .select("id")
      .eq("id", p.id);

    // Repo search query check (PropertyRepository.search)
    const { data: repoQuery } = await anonClient
      .from("properties")
      .select("*, property_images(*), profiles!inner(id, name, agencyName, badgeVerified, avatarUrl, phone, status)")
      .eq("status", "APPROVED")
      .eq("profiles.status", "ACTIVE")
      .eq("id", p.id);

    summary.push({
      id: p.id,
      title: p.title,
      propertyStatus: p.status,
      ownerId: p.ownerId,
      ownerEmail: owner?.email,
      ownerRole: owner?.role,
      ownerStatus: owner?.status,
      subscriptionStatus: sub?.status ?? 'NONE',
      subscriptionEndDate: sub?.endDate ? new Date(sub.endDate).toISOString() : null,
      visiblePropertiesRLS: (rlsProperty && rlsProperty.length > 0) ? 'YES' : 'NO (RLS blocked)',
      visibleInSearchQuery: (repoQuery && repoQuery.length > 0) ? 'YES' : 'NO (Invisible in /annonces)',
    });
  }

  console.table(summary);

  console.log('\n=== RLS POLICY properties_public_read in pg_policies ===');
  const policies: any = await prisma.$queryRaw`
    select policyname, tablename, roles, cmd, qual from pg_policies where policyname = 'properties_public_read';
  `;
  console.log(policies);

  await prisma.$disconnect();
}

main().catch(console.error);
