import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Flag, ExternalLink } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { ReportStatusButtons } from "@/components/admin/report-status-buttons";

export const metadata: Metadata = {
  title: "Détail du signalement — Admin",
};

export default async function AdminReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createAdminClient();

  let { data: report } = await supabase
    .from("reports")
    .select("*, reporter:profiles!userId(id, name, full_name, email), property:properties!propertyId(id, title, city)")
    .eq("id", id)
    .single();

  if (!report) {
    const { data: legacy } = await supabase
      .from("reports")
      .select("*, reporter:profiles!reporter_id(id, full_name, email), listing:listings!listing_id(id, title, city)")
      .eq("id", id)
      .single();
    report = legacy as any;
  }

  if (!report) {
    notFound();
  }

  const r = report as any;
  const targetProperty = r.property || r.listing;
  const reporter = r.reporter || {};
  const statusStr = String(r.status || "OPEN").toUpperCase();

  return (
    <div className="animate-fade-in space-y-6">
      <Link
        href="/admin/signalements"
        className="inline-flex items-center gap-2 text-sm font-medium text-neutral-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux signalements
      </Link>

      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-6">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Flag className="h-5 w-5 text-red-500" />
            Signalement d&apos;annonce
          </h1>

          <ReportStatusButtons reportId={r.id} currentStatus={statusStr} />
        </div>

        <div className="rounded-xl border border-neutral-900 bg-neutral-900/50 p-4 text-sm space-y-3">
          <div>
            <span className="text-xs font-semibold uppercase text-neutral-500">Motif</span>
            <p className="font-bold text-red-400 mt-0.5">{r.reason}</p>
            {r.details && <p className="text-xs text-neutral-300 mt-1">{r.details}</p>}
          </div>

          <div className="border-t border-neutral-800 pt-3">
            <span className="text-xs font-semibold uppercase text-neutral-500">Signalé par</span>
            <p className="font-bold text-white">{reporter.name || reporter.full_name || "Utilisateur"}</p>
            <p className="text-xs text-neutral-400">{reporter.email}</p>
          </div>

          <div className="border-t border-neutral-800 pt-3">
            <span className="text-xs font-semibold uppercase text-neutral-500">Annonce concernée</span>
            {targetProperty ? (
              <Link
                href={`/annonces/${targetProperty.id}`}
                target="_blank"
                className="font-bold text-white hover:text-primary-400 flex items-center gap-1.5 mt-0.5"
              >
                {targetProperty.title} ({targetProperty.city})
                <ExternalLink className="h-3.5 w-3.5 text-neutral-500" />
              </Link>
            ) : (
              <p className="text-xs text-neutral-500 mt-0.5">Annonce introuvable</p>
            )}
          </div>

          <div className="border-t border-neutral-800 pt-3">
            <span className="text-xs font-semibold uppercase text-neutral-500">Date</span>
            <p className="text-xs text-neutral-400 mt-0.5">{formatDate(r.createdAt || r.created_at)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
