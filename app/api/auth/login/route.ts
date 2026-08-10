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
    const userEmail = email.toLowerCase().trim();
    const identifier = `login:${ip}:${userEmail}`;

    // Rate Limiting check
    const rateLimit = await loginRateLimiter.check(identifier);
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

    // Authenticate with real password only
    const supabase = await createClient();
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

    loginRateLimiter.reset(identifier);

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

    return NextResponse.json({
      success: true,
      user: data.user,
      profile,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
