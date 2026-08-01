import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("*")
    .like("id", "8dcbf442%");

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log("USER DATA:", JSON.stringify(profiles, null, 2));
}

main();
