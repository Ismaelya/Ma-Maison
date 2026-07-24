import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

const CITIES = ["Niamey", "Zinder", "Maradi", "Tahoua"];
const DISTRICTS = ["Plateau", "Koubia", "Harobanda", "Talladjé", "Sonuci", "Cité Caisse"];
const TYPES = ["HOUSE", "APARTMENT", "VILLA", "ROOM", "OFFICE", "SHOP", "LAND"];
const TRANSACTIONS = ["RENT", "SALE"];

async function run() {
  console.log("=== SEEDING 18 APPROVED PROPERTIES ===");

  // Find owner profile
  let { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "OWNER")
    .limit(1)
    .maybeSingle();

  let ownerId = profile?.id;

  if (!ownerId) {
    const { data: users } = await supabase.auth.admin.listUsers();
    const foundUser = users?.users?.[0];
    ownerId = foundUser?.id || "6bbfb578-e160-4ab7-91d6-ab8670094baf";
  }

  console.log("Using Owner ID:", ownerId);

  // Ensure owner profile
  await supabase.from("profiles").upsert({
    id: ownerId,
    email: "owner.approved@mamaison.ne",
    name: "Propriétaire Modèle",
    role: "OWNER",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);

  // Ensure owner subscription is TRIAL or ACTIVE
  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("userId", ownerId)
    .maybeSingle();

  if (!existingSub) {
    await supabase.from("subscriptions").insert({
      id: "sub-test-approved-15",
      userId: ownerId,
      status: "TRIAL",
      price: 1500,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 86400 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    } as any);
  } else {
    await supabase
      .from("subscriptions")
      .update({ status: "ACTIVE", endDate: new Date(Date.now() + 30 * 86400 * 1000).toISOString() })
      .eq("userId", ownerId);
  }

  // Clear properties
  await supabase.from("properties").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  const propertiesToInsert = [];
  const nowStr = new Date().toISOString();

  for (let i = 1; i <= 18; i++) {
    const city = CITIES[i % CITIES.length];
    const district = DISTRICTS[i % DISTRICTS.length];
    const type = TYPES[i % TYPES.length];
    const transactionType = TRANSACTIONS[i % TRANSACTIONS.length];
    const price = 50000 + (i * 25000);

    propertiesToInsert.push({
      id: `a${i.toString().padStart(7, '0')}-0000-4000-8000-000000000000`,
      ownerId: ownerId,
      title: `Annonce de Test Approved #${i} — ${type} à ${district}`,
      description: `Description complète pour l'annonce #${i}. Localisée dans le quartier ${district} à ${city}. Adresse confidentielle réservée aux abonnés.`,
      type,
      transactionType,
      price,
      city,
      district,
      address: `Rue des Testeurs #${i}, Porte ${10 + i}`,
      rooms: (i % 5) + 1,
      bathrooms: (i % 3) + 1,
      surface: 50 + (i * 20),
      status: "APPROVED",
      isFeatured: i <= 3,
      createdAt: new Date(Date.now() - (18 - i) * 3600 * 1000).toISOString(),
      updatedAt: nowStr,
    });
  }

  const { data: inserted, error } = await supabase
    .from("properties")
    .insert(propertiesToInsert)
    .select();

  if (error) {
    console.error("❌ Seed error:", error.message);
    process.exit(1);
  }

  console.log(`✅ Successfully seeded ${inserted.length} APPROVED properties!`);
}

run().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
