import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { formatDate, cn, getAvatarUrl } from "@/lib/utils";
import { UserActionButton } from "@/components/admin/user-action-button";

export const metadata: Metadata = {
  title: "Gestion des utilisateurs — Admin",
};

export default async function AdminUsersPage() {
  const supabase = await createAdminClient();

  const { data: usersData, error } = await supabase
    .from("profiles")
    .select("*, subscriptions(*)")
    .order("createdAt", { ascending: false });

  const users = (usersData ?? []) as any[];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestion des utilisateurs</h1>
          <p className="mt-1 text-sm text-neutral-400">
            {users.length} utilisateur{users.length > 1 ? "s" : ""} inscrit{users.length > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-800 bg-red-950/50 p-4 text-sm text-red-300">
          Erreur lors du chargement des utilisateurs : {error.message}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-300">
            <thead className="bg-neutral-900 text-xs uppercase text-neutral-400">
              <tr>
                <th className="px-6 py-4 font-semibold">Utilisateur</th>
                <th className="px-6 py-4 font-semibold">Rôle</th>
                <th className="px-6 py-4 font-semibold">Statut Compte</th>
                <th className="px-6 py-4 font-semibold">Statut Abonnement</th>
                <th className="px-6 py-4 font-semibold">Inscrit le</th>
                <th className="px-6 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {users.map((u) => {
                const roleStr = String(u.role || "TENANT").toUpperCase();
                const statusStr = String(u.status || u.account_status || "ACTIVE").toUpperCase();
                const isDeleted = statusStr === "DELETED";
                const isSuspended = statusStr === "SUSPENDED";
                const isOwner = roleStr === "OWNER" || roleStr === "AGENCY";
                const isAdmin = roleStr === "ADMIN";

                const activeSub = (u.subscriptions ?? []).find((s: any) => s.status === "ACTIVE" || s.status === "FREE" || s.status === "TRIAL");
                const subStatus = activeSub ? activeSub.status : "EXPIRED";

                return (
                  <tr key={u.id} className={cn("transition-colors", isDeleted ? "opacity-60 bg-neutral-900/30" : "hover:bg-neutral-900/50")}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-neutral-700 bg-neutral-800">
                          <img
                            src={getAvatarUrl(u.avatarUrl || u.avatar_url, u.name)}
                            alt={u.name || "Avatar"}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div>
                          <Link
                            href={`/admin/utilisateurs/${u.id}`}
                            className="font-semibold text-white hover:text-primary-400 flex items-center gap-1.5"
                          >
                            {u.name || "Sans nom"}
                            {u.badgeVerified && (
                              <ShieldCheck className="h-4 w-4 text-blue-400 inline" />
                            )}
                          </Link>
                          <p className="text-xs text-neutral-400">{u.email}</p>
                          {u.phone && <p className="text-xs text-neutral-500">📞 {u.phone}</p>}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-bold uppercase",
                          isAdmin
                            ? "bg-red-950 text-red-400 border border-red-800"
                            : isOwner
                              ? "bg-secondary-950 text-secondary-400 border border-secondary-800"
                              : "bg-blue-950 text-blue-400 border border-blue-800"
                        )}
                      >
                        {isOwner ? (roleStr === "AGENCY" ? "Agence" : "Propriétaire") : isAdmin ? "Admin" : "Locataire"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-bold uppercase",
                          isDeleted
                            ? "bg-neutral-800 text-neutral-400 border border-neutral-700"
                            : isSuspended
                              ? "bg-red-950 text-red-400 border border-red-800"
                              : "bg-green-950 text-green-400 border border-green-800"
                        )}
                      >
                        {isDeleted ? "Supprimé" : isSuspended ? "Suspendu" : "Actif"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {isOwner ? (
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-bold uppercase",
                            subStatus === "ACTIVE"
                              ? "bg-green-950 text-green-400 border border-green-800"
                              : subStatus === "TRIAL" || subStatus === "FREE"
                                ? "bg-blue-950 text-blue-400 border border-blue-800"
                                : "bg-red-950 text-red-400 border border-red-800"
                          )}
                        >
                          {subStatus === "ACTIVE"
                            ? "Premium"
                            : subStatus === "TRIAL"
                              ? "Essai 30j"
                              : "Expiré"}
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-500">—</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-xs text-neutral-400">
                      {formatDate(u.createdAt || u.created_at)}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <UserActionButton
                        userId={u.id}
                        currentStatus={statusStr as any}
                        userRole={roleStr}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
