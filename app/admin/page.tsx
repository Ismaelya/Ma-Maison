import type { Metadata } from "next";
import Link from "next/link";
import { Users, Building2, CreditCard, Flag, ArrowRight, ShieldAlert } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Administration — Vue globale",
};

export default async function AdminDashboardPage() {
  const supabase = await createAdminClient();

  // Fetch admin metrics
  const [usersCount, ownersCount, listingsCount, pendingPaymentsCount, pendingReportsCount] =
    await Promise.all([
      supabase.from("profiles").select("id", { count: "exact" }),
      supabase.from("profiles").select("id", { count: "exact" }).eq("role", "owner"),
      supabase.from("listings").select("id", { count: "exact" }),
      supabase.from("payments").select("id", { count: "exact" }).eq("status", "pending"),
      supabase.from("reports").select("id", { count: "exact" }).eq("status", "pending"),
    ]);

  const totalUsers = usersCount.count ?? 0;
  const totalOwners = ownersCount.count ?? 0;
  const totalListings = listingsCount.count ?? 0;
  const pendingPayments = pendingPaymentsCount.count ?? 0;
  const pendingReports = pendingReportsCount.count ?? 0;

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          Tableau de bord Administration
        </h1>
        <p className="mt-1 text-neutral-400">
          Vue d&apos;ensemble de la plateforme Ma Maison Niger
        </p>
      </div>

      {/* Action required banners */}
      {pendingPayments > 0 && (
        <div className="rounded-2xl border border-yellow-800 bg-yellow-950/50 p-4 text-yellow-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-6 w-6 text-yellow-400 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">
                  {pendingPayments} demande{pendingPayments > 1 ? "s" : ""} de paiement en attente de vérification
                </p>
                <p className="text-xs text-yellow-400/80">
                  Vérifiez les reçus de paiement Wave/Amanata/Mynita pour valider les abonnements.
                </p>
              </div>
            </div>
            <Link
              href="/admin/paiements"
              className="flex items-center gap-1 rounded-xl bg-yellow-600 px-4 py-2 text-xs font-bold text-black transition-colors hover:bg-yellow-500"
            >
              Vérifier <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={<Users className="h-5 w-5 text-blue-400" />}
          label="Utilisateurs totaux"
          value={String(totalUsers)}
          subtext={`${totalOwners} propriétaires`}
        />
        <MetricCard
          icon={<Building2 className="h-5 w-5 text-green-400" />}
          label="Annonces publiées"
          value={String(totalListings)}
          subtext="Sur tout le territoire"
        />
        <MetricCard
          icon={<CreditCard className="h-5 w-5 text-yellow-400" />}
          label="Paiements en attente"
          value={String(pendingPayments)}
          subtext="À valider manuellement"
          highlight={pendingPayments > 0}
        />
        <MetricCard
          icon={<Flag className="h-5 w-5 text-red-400" />}
          label="Signalements"
          value={String(pendingReports)}
          subtext="En attente de traitement"
        />
      </div>

      {/* Quick Nav Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/admin/paiements"
          className="group rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-xl transition-all hover:border-neutral-700"
        >
          <CreditCard className="h-8 w-8 text-yellow-500 mb-3" />
          <h3 className="font-bold text-white group-hover:text-yellow-400 transition-colors">
            Gestion des Paiements
          </h3>
          <p className="mt-1 text-xs text-neutral-400">
            Validez ou refusez les reçus d&apos;abonnement 1500 FCFA.
          </p>
        </Link>

        <Link
          href="/admin/utilisateurs"
          className="group rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-xl transition-all hover:border-neutral-700"
        >
          <Users className="h-8 w-8 text-blue-500 mb-3" />
          <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors">
            Gestion des Utilisateurs
          </h3>
          <p className="mt-1 text-xs text-neutral-400">
            Consultez et suspendez des comptes en cas d&apos;abus.
          </p>
        </Link>

        <Link
          href="/admin/annonces"
          className="group rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-xl transition-all hover:border-neutral-700"
        >
          <Building2 className="h-8 w-8 text-green-500 mb-3" />
          <h3 className="font-bold text-white group-hover:text-green-400 transition-colors">
            Modération des Annonces
          </h3>
          <p className="mt-1 text-xs text-neutral-400">
            Masquez ou supprimez les annonces non conformes.
          </p>
        </Link>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  subtext,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-xl bg-neutral-950 ${
        highlight ? "border-yellow-600/80 bg-yellow-950/20" : "border-neutral-800"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase text-neutral-400">{label}</span>
        {icon}
      </div>
      <p className="mt-3 text-3xl font-extrabold text-white">{value}</p>
      <p className="mt-1 text-xs text-neutral-500">{subtext}</p>
    </div>
  );
}
