"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function CallbackHandlePage() {
  const router = useRouter();
  const [message, setMessage] = useState("Traitement en cours...");

  useEffect(() => {
    async function handle() {
      try {
        const supabase = createClient();

        const { data, error } = await supabase.auth.getSessionFromUrl({ storeSession: true });

        const url = new URL(window.location.href);
        const next = url.searchParams.get("next") || "/connexion";

        if (error) {
          console.error("getSessionFromUrl error:", error);
          setMessage("Échec de la réinitialisation. Redirection vers la connexion...");
          setTimeout(() => router.push(`/connexion?error=reset_failed`), 1200);
          return;
        }

        setMessage("Réinitialisation réussie — redirection...");
        setTimeout(() => router.push(next), 600);
      } catch (e) {
        console.error(e);
        setMessage("Erreur inattendue. Redirection vers la connexion...");
        setTimeout(() => router.push(`/connexion?error=reset_failed`), 1200);
      }
    }

    handle();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="mb-4">{message}</p>
        <Button variant="ghost" onClick={() => router.push('/connexion')}>Retour</Button>
      </div>
    </div>
  );
}
