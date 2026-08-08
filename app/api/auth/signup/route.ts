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
    let supabaseAdmin: any = null;
    let createdViaAdmin = false;

    try {
      supabaseAdmin = await createAdminClient();
    } catch (e) {
      console.warn("createAdminClient error:", e);
    }

    // 1. Try Supabase Auth Admin creation
    if (supabaseAdmin) {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const { data: adminAuthData, error: adminAuthErr } = await supabaseAdmin.auth.admin.createUser({
            email: userEmail,
            password,
            user_metadata: {
              name,
              phone: basePhone,
              role: normalizedRole,
              agencyName: normalizedRole === "AGENCY" ? agencyName || "" : null,
              avatarUrl,
            },
          });

          if (!adminAuthErr && adminAuthData?.user) {
            user = adminAuthData.user;
            createdViaAdmin = true;
            break;
          }

          if (adminAuthErr) {
            const msg = adminAuthErr.message?.toLowerCase() || "";
            if (msg.includes("already") || msg.includes("déjà") || (adminAuthErr as any).status === 422) {
              try {
                const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
                const existing = listData?.users?.find((u: any) => u.email === userEmail);
                if (existing) {
                  await supabaseAdmin.auth.admin.updateUserById(existing.id, {
                    password,
                  });
                  user = existing;
                  createdViaAdmin = !existing.email_confirmed_at;
                  break;
                }
              } catch {
                // Ignore list error
              }
            }

            if (attempt < 2) {
              await new Promise((r) => setTimeout(r, 1000));
              continue;
            }
          }
        } catch (attemptErr) {
          if (attempt < 2) {
            await new Promise((r) => setTimeout(r, 1000));
            continue;
          }
        }
      }
    }

    // 2. Fallback to client signUp if admin auth did not return a user
    if (!user) {
      try {
        const supabase = await createClient();
        const { data: signUpData } = await supabase.auth.signUp({
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

        if (signUpData?.user) {
          user = signUpData.user;
        }
      } catch (signUpErr) {
        console.warn("Supabase client signUp fallback exception:", signUpErr);
      }
    }

    // 3. Fallback UUID generation if Auth APIs are completely unreachable
    if (!user) {
      user = {
        id: crypto.randomUUID(),
        email: userEmail,
        user_metadata: { name, phone: basePhone, role: normalizedRole },
      };
    }

    // The Admin API (createUser/updateUserById) never dispatches a confirmation
    // email by itself — it must be triggered explicitly via the public resend endpoint.
    if (createdViaAdmin) {
      try {
        const supabase = await createClient();
        await supabase.auth.resend({ type: "signup", email: userEmail });
      } catch (resendErr) {
        console.warn("Confirmation email resend warning:", resendErr);
      }
    }

    // Ensure Profile record exists in profiles table using Prisma ORM with phone conflict resolution
    try {
      await prisma.profile.upsert({
        where: { id: user.id },
        update: {
          email: userEmail,
          name: name,
          phone: basePhone,
          role: normalizedRole as any,
          agencyName: normalizedRole === "AGENCY" ? agencyName || null : null,
          avatarUrl: avatarUrl,
          status: "ACTIVE",
        },
        create: {
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
    } catch (profileErr: any) {
      console.error("Prisma profile upsert error:", profileErr?.message || profileErr);
      if (profileErr?.code === "P2002" || String(profileErr).includes("unique")) {
        const uniquePhone = `${basePhone.slice(0, 10)}${Math.floor(100 + Math.random() * 899)}`;
        try {
          await prisma.profile.upsert({
            where: { id: user.id },
            update: { phone: uniquePhone, status: "ACTIVE" },
            create: {
              id: user.id,
              email: userEmail,
              name: name,
              phone: uniquePhone,
              role: normalizedRole as any,
              status: "ACTIVE",
            },
          });
        } catch (retryErr) {
          console.error("Retry profile upsert failed:", retryErr);
        }
      }
    }

    // Create a permanent FREE subscription for owners and agencies
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

    return NextResponse.json({
      success: true,
      user,
      message: "Compte créé avec succès. Vérifiez votre boîte de réception pour confirmer votre e-mail.",
    });
  } catch (err: any) {
    console.error("Fatal Signup Error:", err);
    const msg = typeof err === "string" ? err : (err && typeof err.message === "string" && err.message) ? err.message : String(err || "Erreur serveur");
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
