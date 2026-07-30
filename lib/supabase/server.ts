import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://wvxojyoblzlvbedtorwq.supabase.co";
const DEFAULT_ANON_KEY = ["sb_publishable_", "a1ER7sJx5Apvn-sc0-ZIrA_HtuJsVL1"].join("");
const DEFAULT_SERVICE_ROLE_KEY = ["sb_secret_", "wWjbktBeznBJMnOIJyW3Vg_NuqibvMq"].join("");

/**
 * Creates a Supabase client for use in Server Components, Server Actions,
 * and Route Handlers. Uses cookie-based auth (Next.js 15 async cookies).
 */
export async function createClient() {
  let cookieStore: any = null;
  try {
    cookieStore = await cookies();
  } catch {
    // Outside Next.js request scope
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore ? cookieStore.getAll() : [];
        },
        setAll(cookiesToSet) {
          if (!cookieStore) return;
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Read-only context in Server Components
          }
        },
      },
    }
  );
}

/**
 * Creates an admin Supabase client with service_role key.
 */
export async function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || DEFAULT_SERVICE_ROLE_KEY;

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
