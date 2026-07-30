export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
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

    const normalizedRole = (role || "TENANT").toUpperCase();
    const avatarUrl = getAvatarUrl(null, name);
    const userEmail = email.trim().toLowerCase();

    let user: any = null;
    let supabaseAdmin: any = null;

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
            email_confirm: true,
            user_metadata: {
              name,
              phone: phone || "",
              role: normalizedRole,
              agencyName: normalizedRole === "AGENCY" ? agencyName || "" : null,
              avatarUrl,
            },
          });

          if (!adminAuthErr && adminAuthData?.user) {
            user = adminAuthData.user;
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
                    email_confirm: true,
                  });
                  user = existing;
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
              phone: phone || "",
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
        user_metadata: { name, phone: phone || "", role: normalizedRole },
      };
    }

    // Ensure Profile record exists in profiles table using Prisma ORM
    try {
      await prisma.profile.upsert({
        where: { id: user.id },
        update: {
          email: userEmail,
          name: name,
          phone: phone || null,
          role: normalizedRole as any,
          agencyName: normalizedRole === "AGENCY" ? agencyName || null : null,
          avatarUrl: avatarUrl,
          status: "ACTIVE",
        },
        create: {
          id: user.id,
          email: userEmail,
          name: name,
          phone: phone || null,
          role: normalizedRole as any,
          agencyName: normalizedRole === "AGENCY" ? agencyName || null : null,
          avatarUrl: avatarUrl,
          status: "ACTIVE",
        },
      });
    } catch (profileErr) {
      console.error("Prisma profile upsert error:", profileErr);
    }

    // Initial 30-day trial subscription for owners and agencies
    if (normalizedRole === "OWNER" || normalizedRole === "AGENCY") {
      try {
        const now = new Date();
        const expiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        await prisma.subscription.create({
          data: {
            userId: user.id,
            status: "ACTIVE",
            price: 0,
            startDate: now,
            endDate: expiry,
          },
        });
      } catch (subErr) {
        console.error("Prisma subscription create error:", subErr);
      }
    }

    try {
      const cookieStore = await cookies();
      cookieStore.set("ma_maison_user_id", user.id, { path: "/", maxAge: 86400 * 30 });
      cookieStore.set("ma_maison_user_email", user.email || userEmail, { path: "/", maxAge: 86400 * 30 });
    } catch (cErr) {
      console.warn("Cookie set error:", cErr);
    }

    return NextResponse.json({
      success: true,
      user,
      message: "Compte créé avec succès.",
    });
  } catch (err: any) {
    console.error("Fatal Signup Error:", err);
    const msg = typeof err === "string" ? err : (err && typeof err.message === "string" && err.message) ? err.message : String(err || "Erreur serveur");
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
