export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";

async function handle(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  if (secret !== "e2e-secret-key-ma-maison-2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = "e2e_tenant_real_browser@example.com";
  const password = "Password123!";

  try {
    const serviceClient = createAdminClient();

    // Check if user already exists
    const { data: usersData } = await serviceClient.auth.admin.listUsers();
    let existingUser = usersData?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      // Reset user password and confirm email
      await serviceClient.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true,
        user_metadata: { role: "TENANT", name: "Locataire Test E2E" },
      });
    } else {
      // Create user
      const { data: newUser, error: createErr } = await serviceClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: "TENANT", name: "Locataire Test E2E" },
      });
      if (createErr || !newUser.user) {
        throw new Error(createErr?.message || "Failed to create test user");
      }
      userId = newUser.user.id;
    }

    // Clean existing test properties & subscriptions
    await prisma.property.deleteMany({ where: { ownerId: userId } });
    await prisma.subscription.deleteMany({ where: { userId } });

    // Force profile role to TENANT
    await prisma.profile.upsert({
      where: { id: userId },
      update: { role: "TENANT", name: "Locataire Test E2E", status: "ACTIVE" },
      create: {
        id: userId,
        email,
        name: "Locataire Test E2E",
        phone: "90000000",
        role: "TENANT",
        status: "ACTIVE",
      },
    });

    return NextResponse.json({
      success: true,
      userId,
      email,
      password,
    });
  } catch (error: any) {
    console.error("Error in prepare-tenant:", error);
    return NextResponse.json({ error: error?.message || "Internal Error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
