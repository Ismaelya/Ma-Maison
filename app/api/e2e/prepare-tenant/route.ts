import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  const expectedSecret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!expectedSecret || secret !== expectedSecret.slice(0, 32)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

  const email = "e2e_tenant_real_browser@example.com";
  const password = "Password123!";

  try {
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
