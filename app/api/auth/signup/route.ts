export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { signupRateLimiter } from "@/lib/rate-limit";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import { getAvatarUrl } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, phone, role, agencyName, isE2EPrepare, e2eSecret } = body;

    // E2E Test Provisioning Mode (Placed before rate limiting & field validation)
    if (isE2EPrepare && e2eSecret === "e2e-secret-key-ma-maison-2026") {
      const e2eEmail = `e2e_tenant_${Date.now()}_${Math.floor(Math.random() * 10000)}@example.com`;
      const e2ePassword = "Password123!";
      const adminClient = await createAdminClient();

      // Create fresh auto-confirmed TENANT user via Supabase Auth Admin API
      const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
        email: e2eEmail,
        password: e2ePassword,
        email_confirm: true,
        user_metadata: { role: "TENANT", name: "Locataire Test E2E" },
      });

      if (createErr || !newUser?.user) {
        throw new Error(createErr?.message || "Failed to create test user");
      }

      const userId = newUser.user.id;

      // Create profile in Prisma DB
      await prisma.profile.create({
        data: {
          id: userId,
          email: e2eEmail,
          name: "Locataire Test E2E",
          phone: `+227${Math.floor(80000000 + Math.random() * 19999999)}`,
          role: "TENANT",
          status: "ACTIVE",
        },
      });

      return NextResponse.json({
        success: true,
        userId,
        email: e2eEmail,
        password: e2ePassword,
      });
    }

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const identifier = `signup:${ip}`;

    // Rate Limiting check on signup per IP
    const rateLimit = await signupRateLimiter.limit(identifier);
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: "Trop de tentatives d'inscription depuis votre adresse IP. Veuillez patienter 1 minute.",
          rateLimit,
        },
        { status: 429 }
      );
    }

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Veuillez remplir tous les champs obligatoires (nom, email, mot de passe)." },
        { status: 400 }
      );
    }

    const ALLOWED_SIGNUP_ROLES = ["TENANT", "OWNER", "AGENCY"];
    const requestedRole = (role || "TENANT").toString().toUpperCase();
    const normalizedRole = ALLOWED_SIGNUP_ROLES.includes(requestedRole) ? requestedRole : "TENANT";
    const avatarUrl = getAvatarUrl(null, name);
    const userEmail = email.trim().toLowerCase();
    const basePhone = phone ? String(phone).trim() : `+227${Math.floor(80000000 + Math.random() * 19999999)}`;

    let user: any = null;
    let emailSent = true;
    let authErrorMsg: string | null = null;

    // 1. Primary Flow: Standard supabase.auth.signUp()
    try {
      const supabase = await createClient();
      const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ma-maison-niger.vercel.app";
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: userEmail,
        password,
        options: {
          emailRedirectTo: `${siteUrl}/callback`,
          data: {
            name,
            phone: basePhone,
            role: normalizedRole,
            agencyName: normalizedRole === "AGENCY" ? agencyName || "" : null,
            avatarUrl,
          },
        },
      });

      if (!signUpErr && signUpData?.user && signUpData.user.identities?.length === 0) {
        return NextResponse.json(
          { error: "Un compte existe déjà avec cette adresse e-mail." },
          { status: 400 }
        );
      } else if (!signUpErr && signUpData?.user) {
        user = signUpData.user;
      } else if (signUpErr) {
        authErrorMsg = signUpErr.message || (signUpErr as any).error_description || String(signUpErr);
      }
    } catch (e: any) {
      authErrorMsg = e?.message || String(e);
    }

    // 2. Fallback Flow: createAdminClient() if primary signUp failed
    if (!user) {
      try {
        const serviceClient = await createAdminClient();

        const { data: usersData } = await serviceClient.auth.admin.listUsers();
        const existing = usersData?.users?.find(
          (u: any) => u.email?.toLowerCase() === userEmail
        );
        if (existing) {
          return NextResponse.json(
            { error: "Un compte existe déjà avec cette adresse e-mail." },
            { status: 400 }
          );
        }

        const { data: adminData, error: adminErr } =
          await serviceClient.auth.admin.createUser({
            email: userEmail,
            password,
            email_confirm: true,
            user_metadata: {
              name,
              phone: basePhone,
              role: normalizedRole,
              agencyName: normalizedRole === "AGENCY" ? agencyName || "" : null,
              avatarUrl,
            },
          });

        if (adminErr || !adminData?.user) {
          return NextResponse.json(
            { error: adminErr?.message || authErrorMsg || "Impossible de créer le compte." },
            { status: 400 }
          );
        }

        user = adminData.user;
        emailSent = false;
      } catch (adminFail: any) {
        return NextResponse.json(
          { error: adminFail?.message || authErrorMsg || "Erreur lors de la création du compte." },
          { status: 500 }
        );
      }
    }

    // 3. Database profile synchronization
    try {
      await prisma.profile.upsert({
        where: { id: user.id },
        update: {
          email: userEmail,
          name,
          phone: basePhone,
          role: normalizedRole as any,
          avatarUrl,
        },
        create: {
          id: user.id,
          email: userEmail,
          name,
          phone: basePhone,
          role: normalizedRole as any,
          status: "ACTIVE",
          avatarUrl,
        },
      });

      if (normalizedRole === "OWNER" || normalizedRole === "AGENCY") {
        const existingSub = await prisma.subscription.findFirst({
          where: { userId: user.id },
        });

        if (!existingSub) {
          await prisma.subscription.create({
            data: {
              userId: user.id,
              status: "FREE",
              price: 0,
              startDate: new Date(),
            },
          });
        }
      }
    } catch (dbError) {
      console.error("[Signup] Warning: Error syncing profile to DB:", dbError);
    }

    return NextResponse.json({
      success: true,
      message: emailSent
        ? "Inscription réussie ! Un e-mail de confirmation vous a été envoyé."
        : "Inscription réussie !",
      userId: user.id,
      emailSent,
    });
  } catch (error: any) {
    console.error("[Signup] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Une erreur interne est survenue." },
      { status: 500 }
    );
  }
}
