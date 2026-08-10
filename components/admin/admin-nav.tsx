"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminNavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  count?: number;
};

export function AdminNav({ items }: { items: AdminNavItem[] }) {
  const pathname = usePathname();

  return (
    <>
      {items.map((item) => {
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
            {!!item.count && (
              <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                {item.count > 99 ? "99+" : item.count}
              </span>
            )}
          </Link>
        );
      })}
    </>
  );
}
