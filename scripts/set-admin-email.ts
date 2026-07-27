import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createAdminClient } from "../lib/supabase/server";

async function setAdminEmail() {
  const email = "ismaelyaoukdo@gmail.com";
  console.log(`Setting ${email} as unique Platform Admin...`);

  const supabase = await createAdminClient();

  // Check if profile exists
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", email)
    .single();

  if (existingProfile) {
    // Direct update via service role
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        role: "ADMIN",
        status: "ACTIVE",
        updatedAt: new Date().toISOString(),
      })
      .eq("id", existingProfile.id);

    if (updateError) {
      console.error("Error updating profile role:", updateError.message);
    } else {
      console.log(`✅ Profile for ${email} successfully set to ADMIN (ID: ${existingProfile.id})`);
    }
  } else {
    // Create user in Supabase auth
    // Password MUST come from environment variable — never hardcode
    const bootstrapPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD;
    if (!bootstrapPassword) {
      console.error(
        "❌ ADMIN_BOOTSTRAP_PASSWORD not set.\n" +
        "   Set it in your .env.local or pass it as an environment variable:\n" +
        '   $env:ADMIN_BOOTSTRAP_PASSWORD="YourSecurePassword!" ; npx tsx scripts/set-admin-email.ts'
      );
      process.exit(1);
    }

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: bootstrapPassword,
      email_confirm: true,
      user_metadata: {
        name: "Ismael Yaou Kdo",
        role: "ADMIN",
      },
    });

    if (authError && !authUser?.user) {
      console.error("Error creating auth user:", authError.message);
      process.exit(1);
    }

    const userId = authUser?.user?.id;
    if (userId) {
      const { error: upsertErr } = await supabase.from("profiles").upsert({
        id: userId,
        email: email,
        name: "Ismael Yaou Kdo",
        role: "ADMIN",
        status: "ACTIVE",
        avatarUrl: "https://ui-avatars.com/api/?name=Ismael+Yaou+Kdo&background=2563eb&color=ffffff&bold=true&size=256",
        updatedAt: new Date().toISOString(),
      });
      if (upsertErr) {
        console.error("Error upserting profile:", upsertErr.message);
      } else {
        console.log(`✅ Created new Admin account for ${email}`);
        console.log("   ⚠️  Remember to change the password after first login.");
      }
    }
  }

  console.log("Admin setup script completed.");
}

setAdminEmail().catch(console.error);
