"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

// N'autorise que les chemins internes relatifs (jamais une URL absolue ou
// protocol-relative comme "//evil.com", qui redirigerait hors du site).
function sanitizeNextPath(raw: string | null): string {
  if (!raw) return "/connexion";
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) {
    return "/connexion";
  }
  return raw;
}

export default function CallbackHandlePage() {
  const router = useRouter();
  const [message, setMessage] = useState("Traitement en cours...");

  useEffect(() => {
    async function handle() {
      try {
        const supabase = createClient();

        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const next = sanitizeNextPath(url.searchParams.get("next"));

        if (code) {
          const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeErr) {
            console.error("Exchange code error:", exchangeErr);
          }
        }

        const { data, error } = await supabase.auth.getSession();

        if (error || !data?.session) {
          console.error("Supabase auth session error:", error);
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
