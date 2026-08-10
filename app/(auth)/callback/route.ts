import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth callback handler.
 * Exchanges the auth code for a session, then sets the role if provided
 * in the user's metadata, and redirects to the dashboard.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ma-maison-niger.vercel.app";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Update profile role from metadata if provided during signup
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const role = user.user_metadata?.role;
        const phone = user.user_metadata?.phone;

        if (role === "owner" || phone) {
          await supabase
            .from("profiles")
            .update({
              ...(role === "owner" ? { role: "owner" as const } : {}),
              ...(phone ? { phone } : {}),
            })
            .eq("id", user.id);
        }
      }

      return NextResponse.redirect(`${siteUrl}${next}`);
    }
  }

  // If something went wrong, redirect to login with error
  return NextResponse.redirect(`${siteUrl}/connexion?error=auth_failed`);
}
