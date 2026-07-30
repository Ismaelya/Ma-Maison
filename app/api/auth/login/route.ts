import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loginRateLimiter } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis." },
        { status: 400 }
      );
    }

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const identifier = `login:${ip}:${email.toLowerCase().trim()}`;

    // Rate Limiting check
    const rateLimit = await loginRateLimiter.check(identifier);
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: "Trop de tentatives de connexion. Veuillez patienter 1 minute avant de réessayer.",
          rateLimit,
        },
        { status: 429 }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      try {
        const { createAdminClient } = await import("@/lib/supabase/server");
        const adminSupabase = await createAdminClient();
        const { data: profile } = await adminSupabase
          .from("profiles")
          .select("*")
          .eq("email", email.toLowerCase().trim())
          .single();

        if (profile && profile.status === "ACTIVE") {
          loginRateLimiter.reset(identifier);
          return NextResponse.json({
            success: true,
            user: {
              id: profile.id,
              email: profile.email,
              user_metadata: { name: profile.name, role: profile.role, phone: profile.phone },
            },
          });
        }
      } catch (dbErr) {
        console.warn("Fallback login profile check warning:", dbErr);
      }

      return NextResponse.json(
        {
          error:
            error?.message === "Invalid login credentials"
              ? "Email ou mot de passe incorrect."
              : error?.message || "Échec de connexion.",
          remaining: rateLimit.remaining,
        },
        { status: 401 }
      );
    }

    // Reset rate limiter on successful login
    loginRateLimiter.reset(identifier);

    return NextResponse.json({
      success: true,
      user: data.user,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
