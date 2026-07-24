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

  // Refresh user session
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (error) {
    if (pathname === "/connexion") {
      return response;
    }
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    url.searchParams.set("error", "session_check_failed");
    return NextResponse.redirect(url);
  }

  // Protect /dashboard and /admin routes
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
    if (!user) {
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
  if (
    user &&
    (pathname === "/connexion" ||
      pathname === "/inscription" ||
      pathname.startsWith("/auth/login") ||
      pathname.startsWith("/auth/register"))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}
