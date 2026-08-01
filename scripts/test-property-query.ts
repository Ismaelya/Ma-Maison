import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const id = "a0000001-0000-4000-8000-000000000000";
  const { data: listing, error } = await supabase
    .from("properties")
    .select("*, profiles(id, name, agencyName, badgeVerified, avatarUrl, phone, createdAt)")
    .eq("id", id)
    .single();

  console.log("QUERY 1 RESULT:", { listing: listing ? listing.id : null, error });

  const { data: listing2, error: error2 } = await supabase
    .from("properties")
    .select("*, profiles!inner(id, name, agencyName, badgeVerified, avatarUrl, phone, createdAt), property_images(url)")
    .eq("id", id)
    .single();

  console.log("QUERY 2 (WITH property_images) RESULT:", { listing2: listing2 ? listing2.id : null, error2 });
}

main();
