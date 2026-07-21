import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Erreur: NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis dans .env.local");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function seedAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@mamaison.ne";
  const adminPassword = process.env.ADMIN_PASSWORD || "AdminSecret123!";
  const adminName = "Administrateur Système";
  const adminPhone = "+22790000000";

  console.log(`🚀 Amorçage du compte Administrateur (${adminEmail})...`);

  // 1. Check if user already exists in auth.users
  const { data: usersList } = await supabaseAdmin.auth.admin.listUsers();
  let adminAuthUser = usersList.users.find((u) => u.email === adminEmail);

  if (!adminAuthUser) {
    console.log(" Création de l'utilisateur Supabase Auth...");
    const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: adminName,
        role: "ADMIN",
      },
    });

    if (createErr || !newUser.user) {
      console.error("❌ Erreur de création Supabase Auth:", createErr);
      process.exit(1);
    }
    adminAuthUser = newUser.user;
  }

  console.log(`✅ Compte Auth ID: ${adminAuthUser.id}`);

  // 2. Upsert profile with ADMIN role and ACTIVE status
  const { error: profileErr } = await supabaseAdmin
    .from("profiles")
    .upsert({
      id: adminAuthUser.id,
      name: adminName,
      full_name: adminName,
      email: adminEmail,
      phone: adminPhone,
      role: "ADMIN",
      status: "ACTIVE",
      account_status: "ACTIVE",
      subscription_status: "active",
      badge_verified: true,
      email_verified: true,
      phone_verified: true,
      updated_at: new Date().toISOString(),
    } as any);

  if (profileErr) {
    console.error("❌ Erreur de mise à jour du profil ADMIN:", profileErr);
    process.exit(1);
  }

  // 3. Record audit log entry
  await supabaseAdmin.from("audit_logs").insert({
    actor_id: adminAuthUser.id,
    action: "ADMIN_ACTION",
    target_id: adminAuthUser.id,
    metadata: { type: "ADMIN_BOOTSTRAP_SUCCESS", email: adminEmail },
  } as any);

  console.log("🎉 Administrateur amorcé avec succès !");
}

seedAdmin().catch((err) => {
  console.error("❌ Erreur lors du seed:", err);
  process.exit(1);
});
