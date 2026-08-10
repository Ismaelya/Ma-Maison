import type { Metadata } from "next";
import Link from "next/link";
import { Users, Building2, CreditCard, Flag, ArrowRight, ShieldAlert, DollarSign } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Administration — Vue globale",
};

export default async function AdminDashboardPage() {
  const supabase = await createAdminClient();

  // Fetch admin metrics with exact filters
  const [
    usersCount,
    ownersCount,
    listingsCount,
    pendingListingsCount,
    pendingPaymentsCount,
    openReportsCount,
    approvedPaymentsData,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact" }),
    supabase.from("profiles").select("id", { count: "exact" }).or("role.eq.OWNER,role.eq.owner,role.eq.AGENCY,role.eq.agency"),
    supabase.from("properties").select("id", { count: "exact" }),
    supabase.from("properties").select("id", { count: "exact" }).or("status.eq.PENDING,status.eq.pending"),
    supabase.from("payments").select("id", { count: "exact" }).or("status.eq.PENDING,status.eq.pending"),
    supabase.from("reports").select("id", { count: "exact" }).or("status.eq.OPEN,status.eq.open,status.eq.pending"),
    supabase.from("payments").select("amount").or("status.eq.APPROVED,status.eq.approved"),
  ]);

  const totalUsers = usersCount.count ?? 0;
  const totalOwners = ownersCount.count ?? 0;
  const totalListings = listingsCount.count ?? 0;
  const pendingListings = pendingListingsCount.count ?? 0;
  const pendingPayments = pendingPaymentsCount.count ?? 0;
  const pendingReports = openReportsCount.count ?? 0;

  // Calculate actual revenue from approved payments
  const totalRevenue = (approvedPaymentsData.data ?? []).reduce(
    (sum, p) => sum + (Number(p.amount) || 0),
    0
  );

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">
            Tableau de bord Administration
          </h1>
          <p className="mt-0.5 text-sm text-neutral-400">
            Vue d&apos;ensemble de la plateforme Ma Maison Niger
          </p>
        </div>
      </div>

      {/* Action required banners */}
      {(pendingListings > 0 || pendingPayments > 0) && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {pendingListings > 0 && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-blue-800/70 bg-blue-950/40 px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <Building2 className="h-5 w-5 flex-shrink-0 text-blue-400" />
                <p className="truncate text-sm text-blue-200">
                  <strong className="font-semibold">{pendingListings}</strong> annonce{pendingListings > 1 ? "s" : ""} en attente de validation
                </p>
              </div>
              <Link
                href="/admin/annonces"
                className="flex flex-shrink-0 items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-blue-500"
              >
                Modérer <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}

          {pendingPayments > 0 && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-800/70 bg-amber-950/40 px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <ShieldAlert className="h-5 w-5 flex-shrink-0 text-amber-400" />
                <p className="truncate text-sm text-amber-200">
                  <strong className="font-semibold">{pendingPayments}</strong> paiement{pendingPayments > 1 ? "s" : ""} à vérifier
                </p>
              </div>
              <Link
                href="/admin/paiements"
                className="flex flex-shrink-0 items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-amber-500"
              >
                Vérifier <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <MetricCard
          icon={<Users className="h-4 w-4" />}
          accent="text-blue-400 bg-blue-500/10"
          label="Utilisateurs totaux"
          value={String(totalUsers)}
          subtext={`${totalOwners} propriétaires`}
        />
        <MetricCard
          icon={<Building2 className="h-4 w-4" />}
          accent="text-green-400 bg-green-500/10"
          label="Annonces créées"
          value={String(totalListings)}
          subtext={pendingListings > 0 ? `${pendingListings} en attente` : "Sur tout le territoire"}
          highlight={pendingListings > 0}
        />
        <MetricCard
          icon={<CreditCard className="h-4 w-4" />}
          accent="text-amber-400 bg-amber-500/10"
          label="Paiements en attente"
          value={String(pendingPayments)}
          subtext="À valider manuellement"
          highlight={pendingPayments > 0}
        />
        <MetricCard
          icon={<Flag className="h-4 w-4" />}
          accent="text-red-400 bg-red-500/10"
          label="Signalements"
          value={String(pendingReports)}
          subtext="En attente de traitement"
          highlight={pendingReports > 0}
        />
        <MetricCard
          icon={<DollarSign className="h-4 w-4" />}
          accent="text-emerald-400 bg-emerald-500/10"
          label="Revenus totaux"
          value={formatPrice(totalRevenue)}
          subtext="Paiements validés"
        />
      </div>

      {/* Quick actions toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-950 p-2 shadow-xl">
        <span className="px-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-600">
          Accès rapide
        </span>
        <Link
          href="/admin/paiements"
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white"
        >
          <CreditCard className="h-3.5 w-3.5 text-amber-500" />
          Paiements
        </Link>
        <Link
          href="/admin/utilisateurs"
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white"
        >
          <Users className="h-3.5 w-3.5 text-blue-500" />
          Utilisateurs
        </Link>
        <Link
          href="/admin/annonces"
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white"
        >
          <Building2 className="h-3.5 w-3.5 text-green-500" />
          Annonces
        </Link>
        <Link
          href="/admin/signalements"
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white"
        >
          <Flag className="h-3.5 w-3.5 text-red-500" />
          Signalements
        </Link>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  accent,
  label,
  value,
  subtext,
  highlight = false,
}: {
  icon: React.ReactNode;
  accent: string;
  label: string;
  value: string;
  subtext: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 shadow-xl transition-colors ${
        highlight ? "border-amber-600/60 bg-amber-950/10" : "border-neutral-800 bg-neutral-950"
      }`}
    >
      <div className={`inline-flex rounded-lg p-2 ${accent}`}>{icon}</div>
      <p className="mt-2.5 truncate text-xl font-extrabold tracking-tight text-white">{value}</p>
      <p className="text-xs font-medium text-neutral-400">{label}</p>
      <p className="mt-0.5 truncate text-[11px] text-neutral-600">{subtext}</p>
    </div>
  );
}
