import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { formatDate, getAvatarUrl } from "@/lib/utils";
import { UserActionButton } from "@/components/admin/user-action-button";

export const metadata: Metadata = {
  title: "Détail de l'utilisateur — Admin",
};

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createAdminClient();

  const { data: userProfile } = await supabase
    .from("profiles")
    .select("*, subscriptions(*)")
    .eq("id", id)
    .single();

  if (!userProfile) {
    notFound();
  }

  const u = userProfile as any;
  const activeSub = (u.subscriptions ?? []).find((s: any) => s.status === "ACTIVE" || s.status === "FREE" || s.status === "TRIAL");
  const subStatus = activeSub ? activeSub.status : "EXPIRED";

  // Fetch properties owned by this user
  const { data: userProps } = await supabase
    .from("properties")
    .select("*")
    .eq("ownerId", u.id);

  return (
    <div className="animate-fade-in space-y-6">
      <Link
        href="/admin/utilisateurs"
        className="inline-flex items-center gap-2 text-sm font-medium text-neutral-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux utilisateurs
      </Link>

      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-6">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-primary-500 bg-neutral-900 shadow-md">
              <img
                src={getAvatarUrl(u.avatarUrl || u.avatar_url, u.name)}
                alt={u.name || "Avatar"}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                {u.name || "Utilisateur"}
                {u.badgeVerified && (
                  <ShieldCheck className="h-5 w-5 text-blue-400" />
                )}
              </h1>
              <p className="text-xs text-neutral-400">{u.email}</p>
              {u.phone && <p className="text-xs text-neutral-500">📞 {u.phone}</p>}
            </div>
          </div>

          <UserActionButton
            userId={u.id}
            currentStatus={(u.status ?? "ACTIVE").toUpperCase() as any}
            userRole={(u.role ?? "TENANT").toUpperCase()}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-sm">
          <div className="rounded-xl border border-neutral-900 bg-neutral-900/50 p-4">
            <span className="text-xs font-semibold uppercase text-neutral-500">Rôle</span>
            <p className="font-bold text-white mt-1 capitalize">{u.role}</p>
          </div>

          <div className="rounded-xl border border-neutral-900 bg-neutral-900/50 p-4">
            <span className="text-xs font-semibold uppercase text-neutral-500">Statut Compte</span>
            <p className="font-bold text-white mt-1 capitalize">{u.status}</p>
          </div>

          <div className="rounded-xl border border-neutral-900 bg-neutral-900/50 p-4">
            <span className="text-xs font-semibold uppercase text-neutral-500">Abonnement</span>
            <p className="font-bold text-white mt-1 capitalize">{subStatus}</p>
          </div>
        </div>

        <div>
          <h3 className="text-base font-bold text-white mb-3">Annonces créées ({(userProps ?? []).length})</h3>
          {(userProps ?? []).length === 0 ? (
            <p className="text-xs text-neutral-500">Aucune annonce publiée.</p>
          ) : (
            <ul className="divide-y divide-neutral-900">
              {(userProps ?? []).map((p: any) => (
                <li key={p.id} className="py-2 flex justify-between text-xs text-neutral-300">
                  <span>{p.title} ({p.city})</span>
                  <span className="font-bold text-primary-400">{p.price} FCFA</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
