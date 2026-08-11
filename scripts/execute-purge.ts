import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log(`================================================================================`);
  console.log(`1. FETCHING THE 17 APPROVED PROPERTIES OF DELETED PROFILES`);
  console.log(`================================================================================\n`);

  // Query: properties APPROVED where owner is DELETED
  const { data: propertiesToPurge, error: pErr } = await serviceClient
    .from('properties')
    .select('id, title, ownerId, profiles!inner(id, email, status)')
    .eq('status', 'APPROVED')
    .eq('profiles.status', 'DELETED');

  if (pErr) {
    console.error('Error fetching properties to purge:', pErr);
    return;
  }

  console.log(`Found ${propertiesToPurge.length} properties to purge:`);
  const propertyIds = propertiesToPurge.map(p => p.id);
  console.table(propertiesToPurge.map(p => ({ id: p.id, title: p.title, ownerEmail: (p.profiles as any)?.email })));

  if (propertyIds.length === 0) {
    console.log('No properties found to purge.');
    return;
  }

  console.log(`\n================================================================================`);
  console.log(`2. EXECUTING PURGE IN FOREIGN-KEY SAFE ORDER`);
  console.log(`================================================================================\n`);

  // Step 2a: Delete property_images
  console.log('a) Deleting property_images...');
  const { error: imgErr, count: imgCount } = await serviceClient
    .from('property_images')
    .delete({ count: 'exact' })
    .in('propertyId', propertyIds);
  console.log(`   Deleted ${imgCount ?? 0} property_images. Error:`, imgErr || 'none');

  // Step 2b: Delete favorites
  console.log('b) Deleting favorites...');
  const { error: favErr, count: favCount } = await serviceClient
    .from('favorites')
    .delete({ count: 'exact' })
    .in('propertyId', propertyIds);
  console.log(`   Deleted ${favCount ?? 0} favorites. Error:`, favErr || 'none');

  // Step 2c: Delete conversations and messages
  console.log('c) Deleting conversations & messages...');
  // Find conversation IDs first
  const { data: convs } = await serviceClient
    .from('conversations')
    .select('id')
    .in('propertyId', propertyIds);
  const convIds = (convs || []).map(c => c.id);

  if (convIds.length > 0) {
    const { error: msgErr, count: msgCount } = await serviceClient
      .from('messages')
      .delete({ count: 'exact' })
      .in('conversationId', convIds);
    console.log(`   Deleted ${msgCount ?? 0} messages. Error:`, msgErr || 'none');

    const { error: convErr, count: convCount } = await serviceClient
      .from('conversations')
      .delete({ count: 'exact' })
      .in('id', convIds);
    console.log(`   Deleted ${convCount ?? 0} conversations. Error:`, convErr || 'none');
  } else {
    console.log('   0 conversations found referencing these properties.');
  }

  // Step 2d: Delete reviews
  console.log('d) Deleting reviews...');
  const { error: revErr, count: revCount } = await serviceClient
    .from('reviews')
    .delete({ count: 'exact' })
    .in('propertyId', propertyIds);
  console.log(`   Deleted ${revCount ?? 0} reviews. Error:`, revErr || 'none');

  // Step 2e: Delete reports
  console.log('e) Deleting reports...');
  const { error: repErr, count: repCount } = await serviceClient
    .from('reports')
    .delete({ count: 'exact' })
    .in('propertyId', propertyIds);
  console.log(`   Deleted ${repCount ?? 0} reports. Error:`, repErr || 'none');

  // Step 2f: Delete the 17 properties
  console.log('f) Deleting the 17 properties from table properties...');
  const { error: propDelErr, count: propDelCount } = await serviceClient
    .from('properties')
    .delete({ count: 'exact' })
    .in('id', propertyIds);
  console.log(`   Deleted ${propDelCount ?? 0} properties. Error:`, propDelErr || 'none');

  console.log(`\n================================================================================`);
  console.log(`3. VERIFICATION AFTER PURGE`);
  console.log(`================================================================================\n`);

  const { data: remainingApproved, count: remCount } = await serviceClient
    .from('properties')
    .select('id, title, ownerId, status, profiles(email, status)', { count: 'exact' })
    .eq('status', 'APPROVED');

  console.log(`Total APPROVED properties remaining in DB: ${remCount} (Expected: 3)`);
  console.table(remainingApproved?.map(p => ({
    id: p.id,
    title: p.title,
    status: p.status,
    ownerEmail: (p.profiles as any)?.email,
    ownerStatus: (p.profiles as any)?.status
  })));
}

main().catch(console.error);
