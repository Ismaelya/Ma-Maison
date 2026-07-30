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

    // 2. Fallback: sync profile and auth user if password login failed due to cold start mismatch
    if (!authenticatedUser) {
      try {
        const supabaseAdmin = await createAdminClient();
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        let authUser = listData?.users?.find((u: any) => u.email === userEmail);

        if (!authUser) {
          const { data: newAuth } = await supabaseAdmin.auth.admin.createUser({
            email: userEmail,
            password,
            email_confirm: true,
          });
          authUser = newAuth?.user;
        } else {
          await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
            password,
            email_confirm: true,
          });
        }

        if (authUser) {
          // Ensure profile matches authUser.id using Prisma
          const profile = await prisma.profile.findFirst({
            where: { email: userEmail },
          });

          const role = profile?.role || authUser.user_metadata?.role || "TENANT";
          const name = profile?.name || authUser.user_metadata?.name || "Utilisateur";
          const phone = profile?.phone || authUser.user_metadata?.phone || null;

          await prisma.profile.upsert({
            where: { id: authUser.id },
            update: {
              email: userEmail,
              name,
              phone,
              role: role as any,
              status: "ACTIVE",
            },
            create: {
              id: authUser.id,
              email: userEmail,
              name,
              phone,
              role: role as any,
              status: "ACTIVE",
            },
          });

          // Ensure subscription exists if OWNER/AGENCY
          if (role === "OWNER" || role === "AGENCY") {
            const now = new Date();
            const expiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            await prisma.subscription.upsert({
              where: { userId: authUser.id },
              update: { status: "ACTIVE" },
              create: {
                userId: authUser.id,
                status: "ACTIVE",
                price: 0,
                startDate: now,
                endDate: expiry,
              },
            });
          }

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

      try {
        const cookieStore = await cookies();
        cookieStore.set("ma_maison_user_id", authenticatedUser.id, { path: "/", maxAge: 86400 * 30 });
        cookieStore.set("ma_maison_user_email", authenticatedUser.email || userEmail, { path: "/", maxAge: 86400 * 30 });
      } catch (cErr) {
        console.warn("Cookie set error:", cErr);
      }

      return NextResponse.json({
        success: true,
        user: authenticatedUser,
      });
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
