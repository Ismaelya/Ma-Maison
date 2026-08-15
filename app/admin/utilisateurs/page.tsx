import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Search } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { formatDate, cn, getAvatarUrl } from "@/lib/utils";
import { UserActionButton } from "@/components/admin/user-action-button";
import { AdminUsersFilters } from "@/components/admin/admin-users-filters";

export const metadata: Metadata = {
  title: "Gestion des utilisateurs — Admin",
};

export default async function AdminUsersPage(props: {
  searchParams?: Promise<{ [key: string]: string | undefined }>;
}) {
  const searchParams = (await props.searchParams) || {};
  const filterQuery = (searchParams.q || "").toLowerCase().trim();
  const filterRole = (searchParams.role || "").toUpperCase().trim();
  const filterStatus = (searchParams.status || "").toUpperCase().trim();
  const startDateStr = searchParams.startDate;
  const endDateStr = searchParams.endDate;

  const hasActiveFilters = !!(
    filterQuery ||
    filterRole ||
    filterStatus ||
    startDateStr ||
    endDateStr
  );

  const supabase = await createAdminClient();

  const { data: usersData, error } = await supabase
    .from("profiles")
    .select("*, subscriptions(*)")
    .order("createdAt", { ascending: false });

  const allUsers = (usersData ?? []) as any[];

  // Filter users based on search parameters (ET logique)
  const filteredUsers = allUsers.filter((u) => {
    const roleStr = String(u.role || "TENANT").toUpperCase();
    const statusStr = String(u.status || u.account_status || "ACTIVE").toUpperCase();
    const nameStr = String(u.name || "").toLowerCase();
    const emailStr = String(u.email || "").toLowerCase();

    // Role filter
    if (filterRole && roleStr !== filterRole) {
      return false;
    }

    // Status filter
    if (filterStatus && statusStr !== filterStatus) {
      return false;
    }

    // Text search filter (name or email)
    if (filterQuery) {
      const matchName = nameStr.includes(filterQuery);
      const matchEmail = emailStr.includes(filterQuery);
      if (!matchName && !matchEmail) {
        return false;
      }
    }

    // Registration date range filter
    if (startDateStr || endDateStr) {
      const createdDate = u.createdAt || u.created_at ? new Date(u.createdAt || u.created_at) : null;
      if (createdDate && !isNaN(createdDate.getTime())) {
        if (startDateStr) {
          const start = new Date(startDateStr);
          start.setHours(0, 0, 0, 0);
          if (createdDate < start) return false;
        }
        if (endDateStr) {
          const end = new Date(endDateStr);
          end.setHours(23, 59, 59, 999);
          if (createdDate > end) return false;
        }
      }
    }

    return true;
  });

  return (
    <div className="animate-fade-in space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestion des utilisateurs</h1>
          <p className="mt-1 text-sm text-neutral-400">
            {allUsers.length} utilisateur{allUsers.length > 1 ? "s" : ""} inscrit{allUsers.length > 1 ? "s" : ""} au total
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-800 bg-red-950/50 p-4 text-sm text-red-300">
          Erreur lors du chargement des utilisateurs : {error.message}
        </div>
      )}

      {/* Barre de filtres utilisateurs */}
      <AdminUsersFilters />

      {/* Compteur de résultats après filtrage */}
      <div className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/60 px-4 py-3 text-sm text-neutral-300">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-primary-400" />
          <span className="font-semibold text-white">
            {hasActiveFilters
              ? `${filteredUsers.length} utilisateur${filteredUsers.length > 1 ? "s" : ""} trouvé${filteredUsers.length > 1 ? "s" : ""} selon les filtres`
              : `Tous les utilisateurs (${allUsers.length})`}
          </span>
        </div>
        <span className="text-xs text-neutral-400">
          Base totale : {allUsers.length} compte{allUsers.length > 1 ? "s" : ""}
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-xl">
        <div className="overflow-x-auto">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-sm text-neutral-500">
              Aucun utilisateur ne correspond aux critères de recherche définis.
            </div>
          ) : (
            <table className="w-full text-left text-sm text-neutral-300">
              <thead className="bg-neutral-900 text-xs uppercase text-neutral-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Utilisateur</th>
                  <th className="px-4 py-3 font-semibold">Rôle</th>
                  <th className="px-4 py-3 font-semibold">Statut Compte</th>
                  <th className="px-4 py-3 font-semibold">Statut Abonnement</th>
                  <th className="px-4 py-3 font-semibold">Inscrit le</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {filteredUsers.map((u) => {
                  const roleStr = String(u.role || "TENANT").toUpperCase();
                  const statusStr = String(u.status || u.account_status || "ACTIVE").toUpperCase();
                  const isDeleted = statusStr === "DELETED";
                  const isSuspended = statusStr === "SUSPENDED";
                  const isOwner = roleStr === "OWNER" || roleStr === "AGENCY";
                  const isAdmin = roleStr === "ADMIN";

                  const activeSub = (u.subscriptions ?? []).find(
                    (s: any) => s.status === "ACTIVE" || s.status === "FREE" || s.status === "TRIAL"
                  );
                  const subStatus = activeSub ? activeSub.status : "EXPIRED";

                  return (
                    <tr
                      key={u.id}
                      className={cn(
                        "transition-colors",
                        isDeleted ? "opacity-60 bg-neutral-900/30" : "hover:bg-neutral-900/50"
                      )}
                    >
                      <td className="px-4 py-3">
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

                      <td className="px-4 py-3">
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
                          {isOwner
                            ? roleStr === "AGENCY"
                              ? "Agence"
                              : "Propriétaire"
                            : isAdmin
                              ? "Admin"
                              : "Locataire"}
                        </span>
                      </td>

                      <td className="px-4 py-3">
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

                      <td className="px-4 py-3">
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

                      <td className="px-4 py-3 text-xs text-neutral-400">
                        {formatDate(u.createdAt || u.created_at)}
                      </td>

                      <td className="px-4 py-3 text-right">
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
          )}
        </div>
      </div>
    </div>
  );
}
