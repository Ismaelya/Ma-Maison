"use client";

import { LogOut } from "lucide-react";
import { useSignOut } from "@/lib/hooks/use-sign-out";

export function HeaderSignOut() {
  const signOut = useSignOut();

  return (
    <button
      type="button"
      onClick={signOut}
      aria-label="Se déconnecter"
      title="Se déconnecter"
      className="inline-flex items-center justify-center rounded-xl p-2 text-stone-600 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
    >
      <LogOut className="h-5 w-5" />
    </button>
  );
}
