import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const pathname = request.nextUrl.pathname;

  // Always purge legacy insecure cookies left by a previous buggy version
  response.cookies.delete("ma_maison_user_id");
  response.cookies.delete("ma_maison_user_email");

  // Refresh user session — only real Supabase sessions are accepted
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (error) {
    if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
      // Redirect loop breaker: if we already came from /connexion, don't redirect back
      const referer = request.headers.get("referer") || "";
      if (referer.includes("/connexion")) {
        // Let the Server Component handle the error gracefully
        return response;
      }
      const url = request.nextUrl.clone();
      url.pathname = "/connexion";
      url.searchParams.set("error", "session_check_failed");
      return NextResponse.redirect(url);
    }
    return response;
  }

  // Protect /dashboard and /admin routes
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
    if (!user) {
      // Redirect loop breaker: if we already came from /connexion, don't redirect back
      const referer = request.headers.get("referer") || "";
      if (referer.includes("/connexion")) {
        return response;
      }
      const url = request.nextUrl.clone();
      url.pathname = "/connexion";
      return NextResponse.redirect(url);
    }

    // Fetch user profile status & role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .single();

    const accountStatus = (profile?.status || "").toUpperCase();
    const role = (profile?.role || "").toUpperCase();

    // Account suspension check
    if (accountStatus === "SUSPENDED" && !pathname.startsWith("/compte-suspendu")) {
      const url = request.nextUrl.clone();
      url.pathname = "/compte-suspendu";
      return NextResponse.redirect(url);
    }

    // Admin role check
    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  // Redirect authenticated users away from auth pages
  // BUT add loop breaker: don't redirect if we came from /dashboard (would cause loop)
  if (
    user &&
    (pathname === "/connexion" ||
      pathname === "/inscription" ||
      pathname.startsWith("/auth/login") ||
      pathname.startsWith("/auth/register"))
  ) {
    const referer = request.headers.get("referer") || "";
    const isLoopingFromDashboard = referer.includes("/dashboard") || referer.includes("/admin");

    if (!isLoopingFromDashboard) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    // If looping from dashboard, let them see the login page to break the loop
    // Also sign them out to clean up the broken session
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore signOut errors
    }
  }

  return response;
}
