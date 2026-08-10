"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Building2, CreditCard, Flag } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/admin",
    icon: LayoutDashboard,
    label: "Vue d'ensemble",
  },
  {
    href: "/admin/annonces",
    icon: Building2,
    label: "Validation Annonces",
  },
  {
    href: "/admin/utilisateurs",
    icon: Users,
    label: "Gestion Utilisateurs",
  },
  {
    href: "/admin/paiements",
    icon: CreditCard,
    label: "Paiements",
  },
  {
    href: "/admin/signalements",
    icon: Flag,
    label: "Signalements",
  },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <>
      {navItems.map((item) => {
        const isActive =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname === item.href || pathname?.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href as any}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary-600/15 text-white ring-1 ring-inset ring-primary-500/40"
                : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
            )}
          >
            <item.icon
              className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-primary-400" : "text-neutral-500")}
            />
            <span className="flex-1">{item.label}</span>
          </Link>
        );
      })}
    </>
  );
}
