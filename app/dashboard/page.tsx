import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Heart, MessageSquare, Plus, Clock, Eye, ArrowRight } from "lucide-react";
import { requireAuth } from "@/lib/auth/helpers";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, getTrialDaysRemaining, getGreeting, cn } from "@/lib/utils";
import { UnreadCountProvider, RealtimeUnreadStatCard, RealtimeUnreadActionLink } from "@/components/dashboard/unread-messages";

export const metadata: Metadata = {
  title: "Tableau de bord",
};

export default async function DashboardPage() {
  const { profile } = await requireAuth();
  const supabase = await createClient();
  const isOwner = (profile.role ?? "").toUpperCase() === "OWNER" || (profile.role ?? "").toUpperCase() === "AGENCY";
  const greeting = getGreeting();

  // Fetch stats and subscription
  const [propertiesResult, viewsResult, favoritesResult, messagesResult, subResult] = await Promise.all([
    isOwner
      ? supabase
          .from("properties")
          .select("id, title, price, createdAt, status, viewCount", { count: "exact" })
          .eq("ownerId", profile.id)
          .order("createdAt", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [], count: 0 }),
    isOwner
      ? supabase
          .from("properties")
          .select("viewCount")
          .eq("ownerId", profile.id)
      : Promise.resolve({ data: [] }),
    supabase
      .from("favorites")
      .select("id", { count: "exact" })
      .eq("userId", profile.id),
    supabase
      .from("messages")
      .select("id", { count: "exact" })
      .eq("receiverId", profile.id)
      .eq("isRead", false),
    isOwner
      ? supabase
          .from("subscriptions")
          .select("*")
          .eq("userId", profile.id)
          .order("createdAt", { ascending: false })
          .limit(1)
          .single()
      : Promise.resolve({ data: null }),
  ]);

  const listingCount = propertiesResult.count ?? 0;
  const totalViews = ((viewsResult as any).data ?? []).reduce(
    (acc: number, item: any) => acc + (item.viewCount ?? 0),
    0
  );
  const favoriteCount = favoritesResult.count ?? 0;
  const unreadCount = messagesResult.count ?? 0;
  const sub = subResult.data as any;
  const trialDays = isOwner && sub?.endDate ? getTrialDaysRemaining(sub.endDate) : null;

  return (
    <UnreadCountProvider initialCount={unreadCount} userId={profile.id}>
    <div className="animate-fade-in space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
          {greeting}, {profile.name?.split(" ")[0] ?? "Utilisateur"} 👋
        </h1>
        <p className="mt-1 text-neutral-600">
          {isOwner
            ? "Gérez vos annonces et consultez vos messages"
            : "Retrouvez vos favoris et vos messages"}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {isOwner && (
          <StatCard
            icon={<Building2 className="h-5 w-5" />}
            label="Annonces"
            value={String(listingCount)}
            color="primary"
          />
        )}
        {isOwner && (
          <StatCard
            icon={<Eye className="h-5 w-5" />}
            label="Vues au total"
            value={String(totalViews)}
            color="info"
          />
        )}
        <StatCard
          icon={<Heart className="h-5 w-5" />}
          label="Favoris"
          value={String(favoriteCount)}
          color="secondary"
        />
        <RealtimeUnreadStatCard />
        {isOwner && trialDays !== null && (
          <StatCard
            icon={<Clock className="h-5 w-5" />}
            label="Jours d'essai restants"
            value={String(trialDays)}
            color={trialDays <= 7 ? "warning" : "success"}
            highlight={trialDays <= 7}
          />
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {isOwner ? (
          <Link
            href="/dashboard/annonces/nouveau"
            className="group relative flex items-center gap-4 overflow-hidden rounded-2xl bg-gradient-brand p-6 shadow-[var(--shadow-card)] transition-all hover:shadow-[var(--shadow-card-hover)] lg:col-span-1"
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-inset ring-white/30 transition-transform group-hover:scale-105">
              <Plus className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-white">Publier une annonce</p>
              <p className="text-sm text-white/80">Ajoutez un nouveau bien</p>
            </div>
            <ArrowRight className="h-5 w-5 flex-shrink-0 text-white/70 transition-transform group-hover:translate-x-1" />
          </Link>
        ) : (
          <Link
            href="/recherche"
            className="group relative flex items-center gap-4 overflow-hidden rounded-2xl bg-gradient-brand p-6 shadow-[var(--shadow-card)] transition-all hover:shadow-[var(--shadow-card-hover)] lg:col-span-1"
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-inset ring-white/30 transition-transform group-hover:scale-105">
              <Eye className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-white">Parcourir les annonces</p>
              <p className="text-sm text-white/80">Découvrez les dernières offres</p>
            </div>
            <ArrowRight className="h-5 w-5 flex-shrink-0 text-white/70 transition-transform group-hover:translate-x-1" />
          </Link>
        )}

        {isOwner && (
          <Link
            href="/recherche"
            className="group flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-card)] transition-all hover:shadow-[var(--shadow-card-hover)]"
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--color-secondary)]/15 text-secondary-600 transition-colors group-hover:bg-secondary-600 group-hover:text-white">
              <Eye className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold text-neutral-900">Parcourir les annonces</p>
              <p className="text-sm text-neutral-500">Découvrez les dernières offres</p>
            </div>
          </Link>
        )}

        <RealtimeUnreadActionLink />
      </div>

      {/* Recent listings (for owners) */}
      {isOwner && propertiesResult.data && propertiesResult.data.length > 0 && (
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-900">
              Vos annonces récentes
            </h2>
            <Link
              href="/dashboard/annonces"
              className="text-sm font-medium text-primary-600 hover:opacity-70"
            >
              Voir tout →
            </Link>
          </div>
          <div className="mt-4 rounded-2xl border border-[var(--border)] bg-white shadow-[var(--shadow-card)]">
            {propertiesResult.data.map((listing: any, i: number) => (
              <Link
                key={listing.id}
                href={`/annonces/${listing.id}`}
                className={cn(
                  "flex items-center justify-between px-5 py-4 transition-colors hover:bg-[var(--color-muted)]",
                  i !== 0 && "border-t border-[var(--border)]"
                )}
              >
                <div>
                  <p className="font-medium text-neutral-900">{listing.title}</p>
                  <p className="text-sm text-neutral-500">
                    {formatPrice(listing.price)} · <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5 inline text-neutral-400" /> {listing.viewCount ?? 0} vue{(listing.viewCount ?? 0) !== 1 ? "s" : ""}</span>
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium",
                    listing.status === "APPROVED"
                      ? "bg-green-100 text-green-700"
                      : "bg-neutral-100 text-neutral-600"
                  )}
                >
                  {listing.status === "APPROVED" ? "Publiée" : listing.status}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
    </UnreadCountProvider>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "primary" | "secondary" | "info" | "success" | "warning";
  highlight?: boolean;
}) {
  const colorMap = {
    primary: "bg-[var(--color-primary)]/15 text-primary-600",
    secondary: "bg-[var(--color-secondary)]/15 text-secondary-600",
    info: "bg-blue-100 text-blue-600",
    success: "bg-green-100 text-green-600",
    warning: "bg-yellow-100 text-yellow-700",
  };

  return (
    <div
      className={cn(
        "group rounded-2xl border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]",
        highlight && "ring-2 ring-yellow-300"
      )}
    >
      <div className={cn("inline-flex rounded-xl p-2.5 transition-transform group-hover:scale-105", colorMap[color])}>
        {icon}
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-neutral-900">{value}</p>
      <p className="text-sm text-neutral-500">{label}</p>
    </div>
  );
}
