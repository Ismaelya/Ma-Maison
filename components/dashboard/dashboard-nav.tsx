"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Heart,
  MessageSquare,
  User,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardNav({ isOwner }: { isOwner: boolean }) {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/dashboard",
      icon: LayoutDashboard,
      label: "Vue d'ensemble",
      show: true,
    },
    {
      href: "/dashboard/annonces",
      icon: Building2,
      label: "Mes biens",
      show: isOwner,
    },
    {
      href: "/dashboard/abonnement",
      icon: CreditCard,
      label: "Abonnement",
      show: isOwner,
    },
    {
      href: "/dashboard/favoris",
      icon: Heart,
      label: "Favoris",
      show: true,
    },
    {
      href: "/dashboard/messages",
      icon: MessageSquare,
      label: "Messages",
      show: true,
    },
    {
      href: "/dashboard/profil",
      icon: User,
      label: "Mon profil",
      show: true,
    },
  ].filter((item) => item.show);

  return (
    <>
      {navItems.map((item) => {
        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname === item.href || pathname?.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href as any}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary-50 text-primary-700"
                : "text-[var(--color-text)] hover:bg-[var(--color-muted)] hover:text-primary-600"
            )}
          >
            <item.icon
              className={cn(
                "h-4 w-4 flex-shrink-0",
                isActive ? "text-primary-600" : "text-neutral-400"
              )}
            />
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
