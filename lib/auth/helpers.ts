import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/types";

export type AuthUser = {
  id: string;
  email: string;
  profile: Profile;
};

/**
 * Gets the current authenticated user and their profile.
 * Redirects to /compte-suspendu if the user's account is suspended.
 * Returns null if not authenticated.
 */
export async function getUser(): Promise<AuthUser | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return null;
  }

  const typedProfile = profile as Profile;

  return {
    id: user.id,
    email: user.email ?? "",
    profile: typedProfile,
  };
}

/**
 * Requires authentication and an active account.
 * Redirects to /connexion if not authenticated, or /compte-suspendu if suspended.
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getUser();

  if (!user) {
    redirect("/connexion");
  }

  const accountStatus = (user.profile.account_status ?? "").toUpperCase();

  if (accountStatus === "SUSPENDED") {
    redirect("/compte-suspendu");
  }

  return user;
}

/**
 * Requires a specific role and active account.
 */
export async function requireRole(role: UserRole): Promise<AuthUser> {
  const user = await requireAuth();

  const userRole = (user.profile.role ?? "").toUpperCase();
  const targetRole = String(role).toUpperCase();

  // Allow OWNER and AGENCY interchangeably for publisher dashboard access
  const isPublisherRole = (userRole === "OWNER" || userRole === "AGENCY") && (targetRole === "OWNER" || targetRole === "AGENCY");

  if (userRole !== targetRole && !isPublisherRole && userRole !== "ADMIN") {
    redirect("/dashboard");
  }

  return user;
}

/**
 * Checks whether an owner or agency can publish/manage listings.
 * Both 'TRIAL' and 'ACTIVE' subscription statuses are permitted.
 * 'EXPIRED' blocks publication.
 * Account status must not be 'SUSPENDED'.
 */
export function canOwnerPublish(profile: Profile): boolean {
  const accountStatus = (profile.account_status ?? "").toUpperCase();
  const role = (profile.role ?? "").toUpperCase();
  const subStatus = (profile.subscription_status ?? "").toUpperCase();

  if (accountStatus === "SUSPENDED") {
    return false;
  }

  if (role !== "OWNER" && role !== "AGENCY" && role !== "ADMIN") {
    return false;
  }

  // TRIAL and ACTIVE are both allowed to publish. Only EXPIRED is blocked.
  return subStatus !== "EXPIRED";
}
