import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: user } = await supabase.from("profiles").select("*").like("id", "8dcbf442%").single();
  const { data: properties } = await supabase.from("properties").select("id, title, ownerId, profiles(id, name, avatarUrl)").limit(10);
  const { data: conversations } = await supabase.from("conversations").select("id, tenantId, ownerId, propertyId").limit(10);

  const info = { user, properties, conversations };
  console.log("DATA_INFO:", JSON.stringify(info, null, 2));
}

main();
