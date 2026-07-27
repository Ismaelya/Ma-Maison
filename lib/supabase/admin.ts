import { createAdminClient as createAdminServerClient } from "./server";

/**
 * Re-exports createAdminClient for @/lib/supabase/admin import compatibility.
 */
export async function createAdminClient() {
  return createAdminServerClient();
}
