/**
 * MA MAISON — Script de mise à jour du compte ADMIN existant
 *
 * Change le mot de passe et/ou l'email d'un compte admin déjà créé
 * par seed-admin.ts. Synchronise auth.users ET public.profiles.email,
 * qui ne sont pas synchronisés automatiquement après la création
 * initiale (le trigger on_auth_user_created ne joue qu'à l'INSERT).
 *
 * Usage :
 *   $env:CURRENT_ADMIN_EMAIL="admin@mamaison.ne"
 *   $env:NEW_ADMIN_EMAIL="nouvel-email@exemple.com"      # optionnel
 *   $env:NEW_ADMIN_PASSWORD="NouveauMotDePasseSolide!"   # optionnel
 *   npx tsx scripts/update-admin.ts
 *
 * Au moins un des deux (NEW_ADMIN_EMAIL, NEW_ADMIN_PASSWORD) doit être fourni.
 */

import { createClient } from '@supabase/supabase-js';
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

async function main() {
  console.log('=== Mise à jour du compte ADMIN — Ma Maison ===\n');

  const currentEmail = process.env.CURRENT_ADMIN_EMAIL;
  const newEmail = process.env.NEW_ADMIN_EMAIL;
  const newPassword = process.env.NEW_ADMIN_PASSWORD;

  if (!currentEmail) {
    console.error('❌ CURRENT_ADMIN_EMAIL requis (l\'email actuel du compte admin à modifier).');
    process.exit(1);
  }
  if (!newEmail && !newPassword) {
    console.error('❌ Fournis au moins NEW_ADMIN_EMAIL ou NEW_ADMIN_PASSWORD.');
    process.exit(1);
  }
  if (newPassword && newPassword.length < 8) {
    console.error('❌ Le nouveau mot de passe doit faire au moins 8 caractères.');
    process.exit(1);
  }

  // 1. Retrouver le compte par son email actuel
  const { data: usersList, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('❌ Erreur récupération liste utilisateurs :', listError.message);
    process.exit(1);
  }

  const existing = usersList.users.find((u) => u.email === currentEmail);
  if (!existing) {
    console.error(`❌ Aucun compte trouvé avec l'email ${currentEmail}.`);
    process.exit(1);
  }

  console.log(`ℹ️ Compte trouvé (id: ${existing.id})`);

  // 2. Vérifier que c'est bien un admin avant de le modifier (garde-fou)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', existing.id)
    .single();

  if (profileError || profile?.role !== 'ADMIN') {
    console.error('❌ Ce compte n\'a pas le rôle ADMIN — arrêt par sécurité.');
    console.error('   Rôle trouvé :', profile?.role ?? 'inconnu');
    process.exit(1);
  }

  // 3. Mise à jour côté Supabase Auth
  const authUpdatePayload: { email?: string; password?: string; email_confirm?: boolean } = {};
  if (newEmail) {
    authUpdatePayload.email = newEmail;
    authUpdatePayload.email_confirm = true; // évite l'email de vérification, confirme directement
  }
  if (newPassword) {
    authUpdatePayload.password = newPassword;
  }

  const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
    existing.id,
    authUpdatePayload
  );

  if (authUpdateError) {
    console.error('❌ Erreur mise à jour Auth :', authUpdateError.message);
    process.exit(1);
  }

  console.log('✅ Compte Supabase Auth mis à jour.');

  // 4. Synchronisation profiles.email si l'email a changé
  //    (le trigger on_auth_user_created ne se déclenche qu'à la création,
  //    jamais sur les updates ultérieurs — sync manuelle nécessaire ici)
  if (newEmail) {
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({ email: newEmail })
      .eq('id', existing.id);

    if (profileUpdateError) {
      console.error('⚠️ Auth mis à jour mais échec de la synchro profiles.email :', profileUpdateError.message);
      console.error('   Corrige manuellement profiles.email en base pour ce compte.');
      process.exit(1);
    }
    console.log('✅ profiles.email synchronisé avec la nouvelle adresse.');
  }

  console.log('\n🎉 Mise à jour terminée.');
  if (newEmail) console.log(`   Nouvel email : ${newEmail}`);
  if (newPassword) console.log('   Nouveau mot de passe : (défini, non ré-affiché)');
}

main().catch((err) => {
  console.error('❌ Erreur inattendue :', err);
  process.exit(1);
});
