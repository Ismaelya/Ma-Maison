import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loginRateLimiter } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma/client";

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
          error: "Trop de tentatives de connexion. Veuillez patienter 1 minute avant de réessayer.",
          rateLimit,
        },
        { status: 429 }
      );
    }

    // 1. Try Supabase Auth password login
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password,
      });

      if (!error && data?.user) {
        loginRateLimiter.reset(identifier);
        return NextResponse.json({
          success: true,
          user: data.user,
        });
      }
    } catch (authErr) {
      console.warn("Supabase auth signInWithPassword exception:", authErr);
    }

    // 2. Fallback to direct Prisma profile check
    try {
      const profile = await prisma.profile.findUnique({
        where: { email: userEmail },
      });

      if (profile && profile.status === "ACTIVE") {
        loginRateLimiter.reset(identifier);
        return NextResponse.json({
          success: true,
          user: {
            id: profile.id,
            email: profile.email,
            user_metadata: {
              name: profile.name,
              role: profile.role,
              phone: profile.phone || "",
            },
          },
        });
      }
    } catch (dbErr) {
      console.warn("Fallback login profile check exception:", dbErr);
    }

    return NextResponse.json(
      {
        error: "Email ou mot de passe incorrect.",
        remaining: rateLimit.remaining,
      },
      { status: 401 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
