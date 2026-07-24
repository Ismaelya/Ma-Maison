/**
 * MA MAISON — Script de bootstrap du premier compte admin
 *
 * À exécuter UNE SEULE FOIS, manuellement, en local ou en CI.
 * Jamais via un endpoint applicatif (Partie 2 : "le compte admin
 * ne doit jamais être créé via un flux applicatif normal").
 *
 * Utilise la clé SUPABASE_SERVICE_ROLE_KEY — ne JAMAIS committer
 * cette clé, ne jamais l'exposer côté client.
 *
 * Usage :
 *   npx tsx scripts/seed-admin.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis dans .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function ask(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (answer) => { rl.close(); resolve(answer); }));
}

async function main() {
  console.log('=== Bootstrap du premier compte ADMIN — Ma Maison ===\n');

  const email = process.env.ADMIN_EMAIL || await ask('Email admin : ');
  const password = process.env.ADMIN_PASSWORD || await ask('Mot de passe (min 8 caractères) : ');
  const name = process.env.ADMIN_NAME || await ask('Nom complet : ');
  const phone = process.env.ADMIN_PHONE || await ask('Téléphone : ');

  if (!email || !password || password.length < 8) {
    console.error('❌ Email et mot de passe (8+ caractères) requis.');
    process.exit(1);
  }

  let userId: string;

  // 1. Création ou récupération du compte Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    // Si l'utilisateur existe déjà, on récupère son ID dans la liste
    const { data: usersList } = await supabase.auth.admin.listUsers();
    const existing = usersList?.users.find((u) => u.email === email);
    if (existing) {
      userId = existing.id;
      console.log(`ℹ️ Compte Auth déjà existant (id: ${userId})`);
    } else {
      console.error('❌ Erreur création compte Auth :', authError.message);
      process.exit(1);
    }
  } else if (authData?.user) {
    userId = authData.user.id;
    console.log(`✅ Compte Supabase Auth créé (id: ${userId})`);
  } else {
    console.error('❌ Impossible d\'obtenir le compte Auth.');
    process.exit(1);
  }

  // 2. Le trigger on_auth_user_created a déjà créé une ligne dans profiles
  //    avec role = TENANT par défaut. On la met à jour vers ADMIN.
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      role: 'ADMIN',
      name,
      phone,
      status: 'ACTIVE',
      "emailVerified": true,
    })
    .eq('id', userId);

  if (updateError) {
    console.error('❌ Erreur mise à jour profil en ADMIN :', updateError.message);
    console.error('   Le compte Auth existe mais n\'a pas été promu admin — corrige manuellement en base si besoin.');
    process.exit(1);
  }

  console.log('✅ Profil promu ADMIN avec succès.');
  console.log(`\n🎉 Premier admin créé : ${email}`);
  console.log('   Connecte-toi via /auth/login sur l\'application avec ces identifiants.');
}

main().catch((err) => {
  console.error('❌ Erreur inattendue :', err);
  process.exit(1);
});