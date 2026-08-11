import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const anonClient = createClient(supabaseUrl, supabaseAnonKey);
const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  const { data: properties, error: pErr } = await serviceClient
    .from('properties')
    .select('id, title, status, ownerId, createdAt, profiles(id, email, role, status)')
    .order('createdAt', { ascending: false });

  if (pErr) {
    console.error('Error fetching properties:', pErr);
    return;
  }

  const { data: subscriptions } = await serviceClient
    .from('subscriptions')
    .select('id, userId, status, endDate, createdAt')
    .order('createdAt', { ascending: false });

  console.log(`========================================================================================================`);
  console.log(`DIAGNOSTIC COMPLET DES ${properties.length} ANNONCES DANS LA BASE DE DONNÉES`);
  console.log(`========================================================================================================\n`);

  for (const p of properties) {
    const owner: any = p.profiles;
    const userSubs = (subscriptions || []).filter(s => s.userId === p.ownerId);
    const latestSub = userSubs[0] || null;

    // Test anon query (what /annonces & /recherche execute via PropertyRepository.search)
    const { data: anonProp } = await anonClient
      .from('properties')
      .select('*, property_images(*), profiles!inner(id, name, agencyName, badgeVerified, avatarUrl, phone, status)')
      .eq('status', 'APPROVED')
      .eq('profiles.status', 'ACTIVE')
      .eq('id', p.id);

    const isVisibleInAnnonces = Array.isArray(anonProp) && anonProp.length > 0;

    console.log(`--------------------------------------------------------------------------------------------------------`);
    console.log(`- ANNONCE: "${p.title}"`);
    console.log(`  ID:                     ${p.id}`);
    console.log(`  Status Annonce:         ${p.status}`);
    console.log(`  Créée le:               ${p.createdAt}`);
    console.log(`  Propriétaire ID:        ${p.ownerId}`);
    console.log(`  Propriétaire Email:     ${owner?.email || 'N/A'}`);
    console.log(`  Propriétaire Rôle:      ${owner?.role || 'N/A'}`);
    console.log(`  Propriétaire Statut:    ${owner?.status || 'N/A'}`);
    console.log(`  Abonnement Statut:      ${latestSub?.status || 'AUCUN'} (endDate: ${latestSub?.endDate || 'null'})`);
    console.log(`  Visible dans /annonces: ${isVisibleInAnnonces ? 'OUI ✅' : 'NON ❌'}`);

    if (p.status === 'APPROVED' && !isVisibleInAnnonces) {
      console.log(`  ⚠️ CAUSE DE L'INVISIBILITÉ:`);
      if (owner?.status !== 'ACTIVE') {
        console.log(`     -> Propriétaire statut = '${owner?.status}' (non ACTIVE). La policy RLS is_active_owner() et la jointure profiles.status='ACTIVE' masquent cette annonce.`);
      } else {
        console.log(`     -> Propriétaire est ACTIVE mais l'annonce est masquée par une autre contrainte.`);
      }
    }
  }
}

main().catch(console.error);
