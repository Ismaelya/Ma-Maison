import type { Metadata } from "next";
import Link from "next/link";
import { Flag, ExternalLink, CheckCircle2, XCircle } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { formatDate, cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Gestion des signalements — Admin",
};

export default async function AdminReportsPage() {
  const supabase = await createAdminClient();

  const { data: reportsData, error } = await supabase
    .from("reports")
    .select("*, reporter:profiles!reporter_id(id, full_name, email), listing:listings!listing_id(id, title, city)")
    .order("created_at", { ascending: false });

  const reports = (reportsData ?? []) as any[];

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Signalements d&apos;annonces</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Traitez les signalements transmis par les utilisateurs
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-800 bg-red-950/50 p-4 text-sm text-red-300">
          Erreur lors du chargement des signalements.
        </div>
      )}

      {reports.length === 0 ? (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-12 text-center text-sm text-neutral-500">
          Aucun signalement en attente.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-300">
              <thead className="bg-neutral-900 text-xs uppercase text-neutral-400">
                <tr>
                  <th className="px-6 py-4 font-semibold">Annonce</th>
                  <th className="px-6 py-4 font-semibold">Signalé par</th>
                  <th className="px-6 py-4 font-semibold">Motif</th>
                  <th className="px-6 py-4 font-semibold">Statut</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-neutral-900/50 transition-colors">
                    <td className="px-6 py-4">
                      {r.listing ? (
                        <Link
                          href={`/annonces/${r.listing.id}`}
                          target="_blank"
                          className="font-semibold text-white hover:text-primary-400 flex items-center gap-1.5"
                        >
                          {r.listing.title}
                          <ExternalLink className="h-3.5 w-3.5 text-neutral-500" />
                        </Link>
                      ) : (
                        <span className="text-xs text-neutral-500">Annonce supprimée</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-semibold text-white">
                        {r.reporter?.full_name ?? "Utilisateur"}
                      </p>
                      <p className="text-xs text-neutral-400">{r.reporter?.email}</p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-semibold text-red-400">{r.reason}</p>
                      {r.details && (
                        <p className="text-xs text-neutral-400 mt-0.5">{r.details}</p>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-bold uppercase",
                          r.status === "resolved"
                            ? "bg-green-950 text-green-400 border border-green-800"
                            : r.status === "dismissed"
                              ? "bg-neutral-800 text-neutral-400 border border-neutral-700"
                              : "bg-yellow-950 text-yellow-400 border border-yellow-800"
                        )}
                      >
                        {r.status === "resolved"
                          ? "Traité"
                          : r.status === "dismissed"
                            ? "Classé"
                            : "En attente"}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-xs text-neutral-400">
                      {formatDate(r.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
