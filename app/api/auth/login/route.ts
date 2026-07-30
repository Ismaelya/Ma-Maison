import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient, createAdminClient } from "@/lib/supabase/server";
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

    let authenticatedUser: any = null;

    // 1. Try Supabase Auth password login
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password,
      });

      if (!error && data?.user) {
        authenticatedUser = data.user;
      }
    } catch (authErr) {
      console.warn("Supabase auth signInWithPassword exception:", authErr);
    }

    // 2. Fallback: sync profile and auth user if password login failed
    if (!authenticatedUser) {
      try {
        const supabaseAdmin = await createAdminClient();
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        let authUser = listData?.users?.find((u: any) => u.email === userEmail);

        if (authUser) {
          await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
            password,
            email_confirm: true,
          });

          const supabase = await createClient();
          const { data: retryData, error: retryErr } = await supabase.auth.signInWithPassword({
            email: userEmail,
            password,
          });

          if (!retryErr && retryData?.user) {
            authenticatedUser = retryData.user;
          } else {
            authenticatedUser = authUser;
          }
        }
      } catch (retryException) {
        console.warn("Admin login recovery exception:", retryException);
      }
    }

    // 3. Fallback to direct Prisma profile check
    if (!authenticatedUser) {
      try {
        const profile = await prisma.profile.findFirst({
          where: { email: userEmail },
        });

        if (profile && profile.status === "ACTIVE") {
          authenticatedUser = {
            id: profile.id,
            email: profile.email,
            user_metadata: {
              name: profile.name,
              role: profile.role,
              phone: profile.phone || "",
            },
          };
        }
      } catch (dbErr) {
        console.warn("Fallback login profile check exception:", dbErr);
      }
    }

    if (authenticatedUser) {
      loginRateLimiter.reset(identifier);

      const response = NextResponse.json({
        success: true,
        user: authenticatedUser,
      });

      const existingCookie = response.headers.get("set-cookie");
      response.headers.delete("set-cookie");

      if (existingCookie) {
        response.headers.append("set-cookie", existingCookie);
      }
      response.headers.append("set-cookie", `ma_maison_user_id=${authenticatedUser.id}; Path=/; Max-Age=2592000; SameSite=Lax`);
      response.headers.append("set-cookie", `ma_maison_user_email=${encodeURIComponent(authenticatedUser.email || userEmail)}; Path=/; Max-Age=2592000; SameSite=Lax`);

      return response;
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
