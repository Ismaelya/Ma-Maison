import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { loginRateLimiter } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
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
    const userEmail = email.toLowerCase().trim();
    const identifier = `login:${ip}:${userEmail}`;

    // Rate Limiting check
    const rateLimit = await loginRateLimiter.limit(identifier);
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error:
            "Trop de tentatives de connexion. Veuillez patienter 1 minute avant de réessayer.",
          rateLimit,
        },
        { status: 429 }
      );
    }

    const pendingCookies: { name: string; value: string; options: any }[] = [];

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach((cookie) => pendingCookies.push(cookie));
          },
        },
      }
    );

    // Authenticate with real password only
    const { data, error } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password,
    });

    if (error || !data?.user) {
      if (error?.code === "email_not_confirmed") {
        return NextResponse.json(
          {
            error: "Veuillez confirmer votre adresse e-mail avant de vous connecter. Vérifiez votre boîte de réception.",
            remaining: rateLimit.remaining,
          },
          { status: 401 }
        );
      }

      return NextResponse.json(
        {
          error: "Email ou mot de passe incorrect.",
          remaining: rateLimit.remaining,
        },
        { status: 401 }
      );
    }

    // Obligation de confirmation par e-mail avant la connexion
    if (!data.user.email_confirmed_at) {
      try {
        await supabase.auth.signOut();
      } catch {}
      return NextResponse.json(
        {
          error: "Veuillez confirmer votre adresse e-mail avant de vous connecter. Vérifiez votre boîte de réception.",
          remaining: rateLimit.remaining,
        },
        { status: 401 }
      );
    }

    // Fetch exact profile from Supabase (source of truth)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, status, name")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Impossible de charger le profil utilisateur." },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: data.user,
      profile,
    });

    pendingCookies.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
