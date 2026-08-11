"use client";

import { LogOut } from "lucide-react";
import { useSignOut } from "@/lib/hooks/use-sign-out";

export function DashboardSignOut() {
  const signOut = useSignOut();

  return (
    <button
      onClick={signOut}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
    >
      <LogOut className="h-4 w-4" />
      Se déconnecter
    </button>
  );
}
