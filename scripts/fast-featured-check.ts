import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const anonClient = createClient(supabaseUrl, supabaseAnonKey);
const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  // Service role query: all properties
  const { data: allProps } = await serviceClient
    .from('properties')
    .select('id, title, status, isFeatured, ownerId, property_images(url), profiles(status)');

  console.log(`TOTAL PROPERTIES IN DB: ${allProps?.length || 0}`);

  const isFeaturedProps = allProps?.filter(p => p.isFeatured) || [];
  console.log(`PROPERTIES WITH isFeatured = true (ALL STATUSES): ${isFeaturedProps.length}`);
  console.log(isFeaturedProps.map(p => ({ id: p.id, title: p.title, status: p.status, ownerStatus: (p.profiles as any)?.status })));

  const approvedProps = allProps?.filter(p => p.status === 'APPROVED') || [];
  console.log(`\nTOTAL APPROVED PROPERTIES IN DB: ${approvedProps.length}`);

  const approvedFeatured = approvedProps.filter(p => p.isFeatured);
  console.log(`APPROVED PROPERTIES WITH isFeatured = true: ${approvedFeatured.length}`);

  const approvedWithActiveOwner = approvedProps.filter(p => (p.profiles as any)?.status === 'ACTIVE');
  console.log(`APPROVED PROPERTIES WITH ACTIVE OWNER: ${approvedWithActiveOwner.length}`);

  // Test anon client queries from app/(public)/page.tsx
  console.log('\n--- TESTING QUERY IN APP/(PUBLIC)/PAGE.TSX ---');
  const [featuredResult, recentResult] = await Promise.all([
    anonClient
      .from("properties")
      .select("id, title, city, district, price, type, transactionType, isFeatured, createdAt, property_images!inner(url)")
      .eq("status", "APPROVED")
      .eq("isFeatured", true)
      .order("createdAt", { ascending: false })
      .limit(6),
    anonClient
      .from("properties")
      .select("*, property_images(url), profiles(id, name, agencyName, badgeVerified, avatarUrl, phone, role)")
      .eq("status", "APPROVED")
      .order("createdAt", { ascending: false })
      .limit(6),
  ]);

  console.log('featuredResult (anon): count =', featuredResult.data?.length || 0, 'error =', featuredResult.error);
  console.log('recentResult (anon): count =', recentResult.data?.length || 0, 'error =', recentResult.error);
  if (recentResult.data) {
    console.log('recentResult items:');
    recentResult.data.forEach(p => {
      console.log(`  - "${p.title}" (ID: ${p.id}, images count: ${p.property_images?.length || 0})`);
    });
  }
}

main().catch(console.error);
