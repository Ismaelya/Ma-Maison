import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
const prisma = new PrismaClient();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const anonClient = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('=== CHECKING DB FOR ISFEATURED & APPROVED ===\n');

  // 1. Raw DB count of isFeatured properties
  const rawFeatured: any[] = await prisma.$queryRaw`
    select p.id, p.title, p.status, p."isFeatured", p."ownerId", prof.status as owner_status,
      (select count(*) from property_images img where img."propertyId" = p.id) as img_count
    from properties p
    left join profiles prof on prof.id = p."ownerId"
    where p."isFeatured" = true;
  `;
  console.log(`1. Total properties in DB with isFeatured = true: ${rawFeatured.length}`);
  console.table(rawFeatured);

  // 2. Raw DB count of APPROVED properties
  const rawApproved: any[] = await prisma.$queryRaw`
    select p.id, p.title, p.status, p."isFeatured", p."ownerId", prof.status as owner_status,
      (select count(*) from property_images img where img."propertyId" = p.id) as img_count
    from properties p
    left join profiles prof on prof.id = p."ownerId"
    where p.status = 'APPROVED';
  `;
  console.log(`\n2. Total APPROVED properties in DB: ${rawApproved.length}`);
  console.table(rawApproved);

  // 3. Test exact queries run by app/(public)/page.tsx using anon client
  console.log('\n3. Anon Client Query for featuredResult (line 26-32 of page.tsx):');
  const featuredResult = await anonClient
    .from("properties")
    .select("id, title, city, district, price, type, transactionType, isFeatured, createdAt, property_images!inner(url)")
    .eq("status", "APPROVED")
    .eq("isFeatured", true)
    .order("createdAt", { ascending: false })
    .limit(6);
  console.log('featuredResult count:', featuredResult.data?.length, 'error:', featuredResult.error);
  console.log('featuredResult data:', featuredResult.data);

  console.log('\n4. Anon Client Query for recentResult (line 33-38 of page.tsx):');
  const recentResult = await anonClient
    .from("properties")
    .select("*, property_images(url), profiles(id, name, agencyName, badgeVerified, avatarUrl, phone, role)")
    .eq("status", "APPROVED")
    .order("createdAt", { ascending: false })
    .limit(6);
  console.log('recentResult count:', recentResult.data?.length, 'error:', recentResult.error);
  console.log('recentResult data:', recentResult.data?.map(p => ({ id: p.id, title: p.title, imagesCount: p.property_images?.length })));

  await prisma.$disconnect();
}

main().catch(console.error);
