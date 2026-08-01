import type { Metadata } from "next";
import Link from "next/link";
import { Flag, ExternalLink } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { formatDate, cn } from "@/lib/utils";
import { ReportStatusButtons } from "@/components/admin/report-status-buttons";

export const metadata: Metadata = {
  title: "Gestion des signalements — Admin",
};

export default async function AdminReportsPage() {
  const supabase = await createAdminClient();

  const { data: reportsData, error } = await supabase
    .from("reports")
    .select("*, reporter:profiles!userId(id, name, email), property:properties!propertyId(id, title, city)")
    .order("createdAt", { ascending: false });

  let reports = (reportsData ?? []) as any[];

  if (reports.length === 0) {
    const { data: fallback } = await supabase
      .from("reports")
      .select("*, reporter:profiles!reporter_id(id, name, email), listing:listings!listing_id(id, title, city)")
      .order("created_at", { ascending: false });
    reports = (fallback ?? []) as any[];
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Signalements d&apos;annonces</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Traitez les signalements transmis par les utilisateurs ({reports.length} au total)
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-800 bg-red-950/50 p-4 text-sm text-red-300">
          Erreur lors du chargement des signalements : {error.message}
        </div>
      )}

      {reports.length === 0 ? (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-12 text-center text-sm text-neutral-500">
          Aucun signalement enregistré.
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
                  <th className="px-6 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {reports.map((r) => {
                  const targetProperty = r.property || r.listing;
                  const reporter = r.reporter || {};
                  const statusStr = String(r.status || "OPEN").toUpperCase();

                  return (
                    <tr key={r.id} className="hover:bg-neutral-900/50 transition-colors">
                      <td className="px-6 py-4">
                        {targetProperty ? (
                          <Link
                            href={`/admin/signalements/${r.id}`}
                            className="font-semibold text-white hover:text-primary-400 flex items-center gap-1.5"
                          >
                            {targetProperty.title}
                            <ExternalLink className="h-3.5 w-3.5 text-neutral-500" />
                          </Link>
                        ) : (
                          <span className="text-xs text-neutral-500">Annonce introuvable</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-semibold text-white">
                          {reporter.name || "Utilisateur"}
                        </p>
                        <p className="text-xs text-neutral-400">{reporter.email}</p>
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
                            statusStr === "CLOSED"
                              ? "bg-green-950 text-green-400 border border-green-800"
                              : statusStr === "IN_REVIEW"
                                ? "bg-yellow-950 text-yellow-400 border border-yellow-800"
                                : "bg-red-950 text-red-400 border border-red-800"
                          )}
                        >
                          {statusStr === "CLOSED"
                            ? "Clôturé"
                            : statusStr === "IN_REVIEW"
                              ? "En cours"
                              : "Ouvert"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-xs text-neutral-400">
                        {formatDate(r.createdAt || r.created_at)}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <ReportStatusButtons reportId={r.id} currentStatus={statusStr} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
