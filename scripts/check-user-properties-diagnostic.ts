import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const anonClient = createClient(supabaseUrl, supabaseAnonKey);
const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

const ownerId = '62d58103-5cc2-457a-98f5-0bb2856e2563';

async function main() {
  console.log(`================================================================================`);
  console.log(`1. LISTING ALL PROPERTIES FOR OWNER: ${ownerId}`);
  console.log(`================================================================================\n`);

  const { data: properties, error: pErr } = await serviceClient
    .from('properties')
    .select('id, title, status, createdAt, city, district, price, type, transactionType, ownerId')
    .eq('ownerId', ownerId)
    .order('createdAt', { ascending: false });

  if (pErr) {
    console.error('Error querying properties:', pErr);
    return;
  }

  console.log(`Total properties found for owner: ${properties?.length || 0}\n`);
  console.table(properties);

  if (!properties || properties.length === 0) {
    console.log('No properties found for this owner.');
    return;
  }

  // 2. Identify the most recent property
  const mostRecent = properties[0];
  if (!mostRecent) {
    console.log('No recent property found.');
    return;
  }
  console.log(`\n================================================================================`);
  console.log(`2. MOST RECENT PROPERTY ANALYSIS`);
  console.log(`================================================================================`);
  console.log(`Title:              "${mostRecent.title}"`);
  console.log(`ID:                 ${mostRecent.id}`);
  console.log(`Status:             ${mostRecent.status}`);
  console.log(`Created At:         ${mostRecent.createdAt}`);

  const now = new Date();
  const createdDate = new Date(mostRecent.createdAt);
  const diffSeconds = Math.round((now.getTime() - createdDate.getTime()) / 1000);
  console.log(`Time elapsed:       ${diffSeconds} seconds ago (${(diffSeconds / 60).toFixed(1)} minutes ago)`);

  // Check owner status
  const { data: ownerProfile } = await serviceClient
    .from('profiles')
    .select('id, email, role, status')
    .eq('id', ownerId)
    .single();

  console.log(`Owner Profile:     `, ownerProfile);

  // 3 & 4. Test direct anon query on this specific property
  console.log(`\n================================================================================`);
  console.log(`3 & 4. DIRECT ANON CLIENT QUERY TEST FOR THIS SPECIFIC PROPERTY`);
  console.log(`================================================================================`);

  // Query 4a: Exact query executed by /annonces & /recherche (PropertyRepository.search)
  const { data: anonRepoSearch, error: anonRepoErr } = await anonClient
    .from('properties')
    .select('*, property_images(*), profiles!inner(id, name, agencyName, badgeVerified, avatarUrl, phone, status)')
    .eq('status', 'APPROVED')
    .eq('profiles.status', 'ACTIVE')
    .eq('id', mostRecent.id);

  console.log(`Anon Repo Search result count:`, anonRepoSearch?.length || 0);
  if (anonRepoErr) console.log(`Anon Repo Search Error:`, anonRepoErr);
  if (anonRepoSearch && anonRepoSearch.length > 0) {
    console.log(`✅ SUCCESS: The property IS returned by the anonymous client query!`);
  } else {
    console.log(`❌ FAILURE: The property IS NOT returned by the anonymous client query!`);
  }

  // Test all properties returned to anon client for /annonces
  const { data: anonAllApproved } = await anonClient
    .from('properties')
    .select('id, title, status, ownerId')
    .eq('status', 'APPROVED');

  console.log(`\nAll APPROVED properties returned to anon client:`, anonAllApproved);
}

main().catch(console.error);
