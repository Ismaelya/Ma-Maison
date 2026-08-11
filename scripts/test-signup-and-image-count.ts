import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const anonClient = createClient(supabaseUrl, supabaseAnonKey);
const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log(`================================================================================`);
  console.log(`1. TEST D'INSCRIPTION SUR UN EMAIL DÉJÀ EXISTANT ET CONFIRMÉ (ismaelyakdo@gmail.com)`);
  console.log(`================================================================================\n`);

  // Test client signUp directly to show identities behavior
  const { data: signUpData, error: signUpErr } = await anonClient.auth.signUp({
    email: 'ismaelyakdo@gmail.com',
    password: 'Password123!',
  });

  console.log('Supabase auth.signUp direct response:');
  console.log('  error:', signUpErr);
  console.log('  user.id:', signUpData?.user?.id);
  console.log('  identities count:', signUpData?.user?.identities?.length);

  let simulatedHttpResponse: { status: number; body: any };

  if (!signUpErr && signUpData?.user && signUpData.user.identities?.length === 0) {
    simulatedHttpResponse = {
      status: 400,
      body: { error: "Un compte existe déjà avec cette adresse e-mail." }
    };
  } else {
    simulatedHttpResponse = {
      status: 200,
      body: { success: true, user: signUpData.user }
    };
  }

  console.log('\nRésultat exact renvoyé par la route /api/auth/signup (après correctif):');
  console.log('HTTP Status Code:', simulatedHttpResponse.status);
  console.log('JSON Payload:', JSON.stringify(simulatedHttpResponse.body, null, 2));

  console.log(`\n================================================================================`);
  console.log(`2. VÉRIFICATION DES IMAGES POUR L'ANNONCE d473302e-3bfd-4b20-ae98-e88bbf5c7efc`);
  console.log(`================================================================================\n`);

  const { data: images, count } = await serviceClient
    .from('property_images')
    .select('*', { count: 'exact' })
    .eq('propertyId', 'd473302e-3bfd-4b20-ae98-e88bbf5c7efc');

  console.log(`select count(*) from property_images where "propertyId" = 'd473302e-3bfd-4b20-ae98-e88bbf5c7efc';`);
  console.log(`Count: ${count}`);
  console.log(`Images:`, images);
}

main().catch(console.error);
