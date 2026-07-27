import { NextResponse } from "next/server";
import { signupRateLimiter } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/server";
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

    const supabaseAdmin = await createAdminClient();
    const normalizedRole = (role || "TENANT").toUpperCase();
    const avatarUrl = getAvatarUrl(null, name);

    // Create auth user with admin client
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
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

    if (authError) {
      return NextResponse.json(
        { error: authError.message || "Erreur lors de la création du compte." },
        { status: 400 }
      );
    }

    const user = authData.user;

    // Ensure Profile record exists in profiles table
    const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
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

    // Initial 30-day trial subscription for owners and agencies
    if (normalizedRole === "OWNER" || normalizedRole === "AGENCY") {
      const now = new Date();
      const expiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      await supabaseAdmin.from("subscriptions").insert({
        userId: user.id,
        status: "ACTIVE",
        price: 0,
        startDate: now.toISOString(),
        endDate: expiry.toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      user,
      message: "Compte créé avec succès.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}
