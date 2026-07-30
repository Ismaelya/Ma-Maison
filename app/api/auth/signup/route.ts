export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { signupRateLimiter } from "@/lib/rate-limit";
import { createClient, createAdminClient } from "@/lib/supabase/server";
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

    let supabase;
    let supabaseAdmin = null;
    try {
      supabase = await createClient();
    } catch (e: any) {
      console.error("Supabase client initialization error:", e);
      return NextResponse.json(
        { error: "Service d'authentification temporairement indisponible." },
        { status: 503 }
      );
    }

    try {
      supabaseAdmin = await createAdminClient();
    } catch (adminInitErr: any) {
      console.warn("Supabase admin client initialization warning:", adminInitErr?.message || adminInitErr);
    }

    const normalizedRole = (role || "TENANT").toUpperCase();
    const avatarUrl = getAvatarUrl(null, name);
    const userEmail = email.trim().toLowerCase();

    let user: any = null;

    // 1. Try admin createUser first (if supabaseAdmin is available)
    if (supabaseAdmin) {
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
        } else if (adminAuthErr) {
          console.warn("admin.createUser returned error, fallback to client signUp:", adminAuthErr.message);
        }
      } catch (adminException: any) {
        console.warn("admin.createUser threw exception:", adminException?.message || adminException);
      }
    }

    // 2. Fallback to client signUp if admin auth did not return a user
    if (!user) {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
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

          if (signUpErr) {
            console.error(`Signup error detail (attempt ${attempt + 1}):`, signUpErr);
            const isUnreachable =
              signUpErr.name === "AuthRetryableFetchError" ||
              signUpErr.message === "{}" ||
              signUpErr.message === "fetch failed" ||
              (signUpErr as any).status === 0;

            if (isUnreachable && attempt < 2) {
              console.warn(`Supabase signUp unreachable, retrying in 1.5s (attempt ${attempt + 1})...`);
              await new Promise((r) => setTimeout(r, 1500));
              continue;
            }

            if (isUnreachable) {
              return NextResponse.json(
                {
                  error: "Service d'authentification temporairement indisponible.",
                  details: signUpErr.message || "AuthRetryableFetchError",
                },
                { status: 503 }
              );
            }

            const errMsg =
              typeof signUpErr.message === "string" && signUpErr.message && signUpErr.message !== "{}"
                ? signUpErr.message
                : (signUpErr as any).error_description
                ? (signUpErr as any).error_description
                : "Erreur lors de la création du compte.";
            return NextResponse.json({ error: String(errMsg) }, { status: 400 });
          }

          if (signUpData?.user) {
            user = signUpData.user;
            break;
          }
        } catch (signUpException: any) {
          if (attempt < 2) {
            await new Promise((r) => setTimeout(r, 1500));
            continue;
          }
          console.error("Supabase auth.signUp exception:", signUpException);
          return NextResponse.json(
            { error: "Service d'authentification temporairement indisponible." },
            { status: 503 }
          );
        }
      }
    }

    // If Supabase Auth is unreachable or failed to produce a user object
    if (!user) {
      return NextResponse.json(
        {
          error: "Service d'authentification temporairement indisponible.",
          details: "Impossible d'initialiser ou de créer l'utilisateur via Supabase Auth.",
        },
        { status: 503 }
      );
    }

    // Ensure Profile record exists in profiles table
    const dbClient = supabaseAdmin || supabase;
    try {
      const { error: profileError } = await dbClient.from("profiles").upsert({
        id: user.id,
        email: user.email!,
        name: name,
        phone: phone || null,
        role: normalizedRole,
        agencyName: normalizedRole === "AGENCY" ? agencyName || null : null,
        avatarUrl: avatarUrl,
        status: "ACTIVE",
        updatedAt: new Date().toISOString(),
      });

      if (profileError) {
        console.error("Profile creation warning:", profileError.message);
      }
    } catch (profileErr) {
      console.error("Failed to upsert profile in Supabase database:", profileErr);
    }

    // Initial 30-day trial subscription for owners and agencies
    if (normalizedRole === "OWNER" || normalizedRole === "AGENCY") {
      try {
        const now = new Date();
        const expiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        await dbClient.from("subscriptions").insert({
          userId: user.id,
          status: "ACTIVE",
          price: 0,
          startDate: now.toISOString(),
          endDate: expiry.toISOString(),
        });
      } catch (subErr) {
        console.error("Failed to insert subscription in Supabase database:", subErr);
      }
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

