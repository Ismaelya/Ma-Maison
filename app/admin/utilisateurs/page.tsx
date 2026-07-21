import type { Metadata } from "next";
import { Users, Search, ShieldCheck } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { formatDate, cn } from "@/lib/utils";
import { UserActionButton } from "@/components/admin/user-action-button";
import type { Profile } from "@/types";

export const metadata: Metadata = {
  title: "Gestion des utilisateurs — Admin",
};

export default async function AdminUsersPage() {
  const supabase = await createAdminClient();

  const { data: usersData, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  const users = (usersData ?? []) as Profile[];

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
          Erreur lors du chargement des utilisateurs.
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
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-neutral-900/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white",
                          u.role === "admin"
                            ? "bg-red-600"
                            : u.role === "owner"
                              ? "bg-secondary-600"
                              : "bg-primary-600"
                        )}
                      >
                        {u.full_name ? u.full_name.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div>
                        <p className="font-semibold text-white flex items-center gap-1.5">
                          {u.full_name ?? "Sans nom"}
                          {u.badge_verified && (
                            <ShieldCheck className="h-4 w-4 text-blue-400 inline" />
                          )}
                        </p>
                        <p className="text-xs text-neutral-400">{u.email}</p>
                        {u.phone && <p className="text-xs text-neutral-500">📞 {u.phone}</p>}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-bold uppercase",
                        u.role === "admin"
                          ? "bg-red-950 text-red-400 border border-red-800"
                          : u.role === "owner"
                            ? "bg-secondary-950 text-secondary-400 border border-secondary-800"
                            : "bg-blue-950 text-blue-400 border border-blue-800"
                      )}
                    >
                      {u.role === "owner" ? "Propriétaire" : u.role === "admin" ? "Admin" : "Locataire"}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-bold uppercase",
                        u.account_status === "active"
                          ? "bg-green-950 text-green-400 border border-green-800"
                          : "bg-red-950 text-red-400 border border-red-800"
                      )}
                    >
                      {u.account_status === "active" ? "Actif" : "Suspendu"}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    {u.role === "owner" ? (
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-bold uppercase",
                          u.subscription_status === "active"
                            ? "bg-green-950 text-green-400 border border-green-800"
                            : u.subscription_status === "trial"
                              ? "bg-blue-950 text-blue-400 border border-blue-800"
                              : "bg-red-950 text-red-400 border border-red-800"
                        )}
                      >
                        {u.subscription_status === "active"
                          ? "Premium"
                          : u.subscription_status === "trial"
                            ? "Essai 30j"
                            : "Expiré"}
                      </span>
                    ) : (
                      <span className="text-xs text-neutral-500">—</span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-xs text-neutral-400">
                    {formatDate(u.created_at)}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <UserActionButton
                      userId={u.id}
                      currentStatus={(u.account_status ?? "active").toLowerCase() as any}
                      userRole={(u.role ?? "tenant").toLowerCase()}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
