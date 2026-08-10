"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type DashboardNavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
};

export function DashboardNav({ items }: { items: DashboardNavItem[] }) {
  const pathname = usePathname();

  return (
    <>
      {items.map((item) => {
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
