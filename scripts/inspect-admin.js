const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, email, role, status")
    .eq("email", "ismaelyaoukdo@gmail.com");

  if (error) {
    console.error("Error:", error);
    process.exit(1);
  }

  console.log("RESULT_DATA:", JSON.stringify(profiles, null, 2));
  process.exit(0);
}

main();
