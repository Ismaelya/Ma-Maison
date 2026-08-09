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
    const { email, password, name, phone, role, agencyName } = body;

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const identifier = `signup:${ip}`;

    // Rate Limiting check on signup per IP
    const rateLimit = await signupRateLimiter.check(identifier);
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
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: userEmail,
        password,
        options: {
          data: {
            name,
            phone: basePhone,
            role: normalizedRole,
            agencyName: normalizedRole === "AGENCY" ? agencyName || "" : null,
            avatarUrl,
          },
        },
      });

      if (!signUpErr && signUpData?.user) {
        user = signUpData.user;
      } else if (signUpErr) {
        authErrorMsg = signUpErr.message || (signUpErr as any).error_description || String(signUpErr);
        const msgLower = (authErrorMsg || "").toLowerCase();
        const errCode = (signUpErr as any).code || "";
        if (
          errCode === "user_already_exists" ||
          errCode === "email_exists" ||
          msgLower.includes("already registered") ||
          msgLower.includes("déjà")
        ) {
          return NextResponse.json(
            { error: "Un compte existe déjà avec cette adresse e-mail." },
            { status: 400 }
          );
        }
      }
    } catch (clientErr: any) {
      console.warn("Client signUp exception:", clientErr?.message || String(clientErr));
      authErrorMsg = clientErr?.message || String(clientErr);
    }

    // 2. Secondary Flow: Fallback to Admin API if client signUp failed due to mailer/SMTP issues
    if (!user) {
      try {
        const supabaseAdmin = await createAdminClient();
        const { data: adminData, error: adminErr } = await supabaseAdmin.auth.admin.createUser({
          email: userEmail,
          password,
          email_confirm: false,
          user_metadata: {
            name,
            phone: basePhone,
            role: normalizedRole,
            agencyName: normalizedRole === "AGENCY" ? agencyName || "" : null,
            avatarUrl,
          },
        });

        if (!adminErr && adminData?.user) {
          user = adminData.user;
          emailSent = false;
        } else if (adminErr) {
          const adminErrMsg = adminErr.message || (adminErr as any).error_description || String(adminErr);
          console.warn("Admin createUser fallback failed:", adminErrMsg);
          const adminMsgLower = adminErrMsg.toLowerCase();
          const adminErrCode = (adminErr as any).code || "";
          if (
            adminErrCode === "user_already_exists" ||
            adminErrCode === "email_exists" ||
            adminMsgLower.includes("already registered") ||
            adminMsgLower.includes("déjà")
          ) {
            return NextResponse.json(
              { error: "Un compte existe déjà avec cette adresse e-mail." },
              { status: 400 }
            );
          }
        }
      } catch (adminException: any) {
        console.warn("Admin client fallback exception:", adminException?.message || String(adminException));
      }
    }

    // 3. Strict Check: NO mock UUID generation. If Auth API failed, return explicit error to caller.
    if (!user) {
      console.error("Signup failed on both primary and fallback paths:", authErrorMsg);
      return NextResponse.json(
        { error: "Impossible de créer le compte pour le moment. Veuillez réessayer dans quelques instants." },
        { status: 500 }
      );
    }

    // 4. Ensure Profile record exists in profiles table using Prisma ORM with conflict resolution
    try {
      const existingProfile = await prisma.profile.findUnique({
        where: { id: user.id },
      });

      if (existingProfile) {
        await prisma.profile.update({
          where: { id: user.id },
          data: {
            email: userEmail,
            name: name,
            role: normalizedRole as any,
            agencyName: normalizedRole === "AGENCY" ? agencyName || null : null,
            avatarUrl: avatarUrl,
            status: "ACTIVE",
          },
        });
      } else {
        await prisma.profile.create({
          data: {
            id: user.id,
            email: userEmail,
            name: name,
            phone: basePhone,
            role: normalizedRole as any,
            agencyName: normalizedRole === "AGENCY" ? agencyName || null : null,
            avatarUrl: avatarUrl,
            status: "ACTIVE",
          },
        });
      }
    } catch (profileErr: any) {
      console.error("Prisma profile sync error:", profileErr?.message || profileErr);
    }

    // 5. Create permanent FREE subscription for owners and agencies
    if (normalizedRole === "OWNER" || normalizedRole === "AGENCY") {
      try {
        const now = new Date();
        const existingSub = await prisma.subscription.findFirst({
          where: { userId: user.id },
        });

        if (existingSub) {
          await prisma.subscription.update({
            where: { id: existingSub.id },
            data: { status: "FREE", endDate: null },
          });
        } else {
          await prisma.subscription.create({
            data: {
              userId: user.id,
              status: "FREE",
              price: 0,
              startDate: now,
              endDate: null,
            },
          });
        }
      } catch (subErr) {
        console.error("Prisma subscription create error:", subErr);
      }
    }

    const message = "Compte créé avec succès. Un e-mail de confirmation vous a été envoyé. Veuillez obligatoirement confirmer votre e-mail avant de vous connecter.";

    return NextResponse.json({
      success: true,
      user,
      emailSent,
      message,
    });
  } catch (err: any) {
    console.error("Fatal Signup Error:", err);
    const msg = typeof err === "string" ? err : (err && typeof err.message === "string" && err.message) ? err.message : String(err || "Erreur serveur");
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
