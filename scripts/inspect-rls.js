const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.rpc("pg_policies"); // or query pg_policies
  console.log("Checking RLS policies...");
  const { data: policies, error: pError } = await supabase
    .from("pg_policies")
    .select("*")
    .eq("tablename", "profiles");

  if (pError) {
    // query via raw SQL or inspect table
    const { data: profiles, error: prErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", "ismaelyaoukdo@gmail.com");
    console.log("PROFILES WITH SERVICE ROLE:", profiles, prErr);
  } else {
    console.log("POLICIES:", policies);
  }
  process.exit(0);
}

main();
