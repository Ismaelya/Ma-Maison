"use client";

import React, { useEffect, useState } from "react";

type DeferredPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandaloneMode(): boolean {
  if (typeof navigator === "undefined") return false;
  return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (navigator as any)['standalone'] === true;
}

export default function InstallPrompt(): React.ReactElement | null {
  const [deferredPrompt, setDeferredPrompt] = useState<DeferredPrompt | null>(null);
  const [visible, setVisible] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onBeforeInstall = (e: Event) => {
      try {
        (e as any).preventDefault();
      } catch {}
      setDeferredPrompt(e as DeferredPrompt);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall as EventListener);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // iOS: show manual instructions if not already installed
    if (isIos() && !isInStandaloneMode()) {
      setShowIosInstructions(true);
      setVisible(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall as EventListener);
    };
  }, []);

  const onInstall = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } catch {}
    setVisible(false);
    setDeferredPrompt(null);
  };

  if (!visible) return null;

  if (showIosInstructions) {
    return (
      <div style={{ position: "fixed", left: 16, right: 16, bottom: 16, padding: 12, background: "white", borderRadius: 8, boxShadow: "0 6px 24px rgba(0,0,0,0.12)", zIndex: 9999, fontSize: 14 }}>
        <div style={{ marginBottom: 8, color: "#111" }}>Pour installer Ma Maison sur iOS : appuyez sur le bouton <strong>Partager</strong> puis choisissez <strong>Ajouter à l'écran d'accueil</strong>.</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={() => { setVisible(false); setShowIosInstructions(false); }} style={{ padding: "8px 12px", background: "#2563eb", color: "white", borderRadius: 6, border: "none" }}>
            J'ai compris
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", left: 16, right: 16, bottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", padding: 12, background: "white", borderRadius: 8, boxShadow: "0 6px 24px rgba(0,0,0,0.12)", zIndex: 9999 }}>
      <div style={{ fontSize: 14, color: "#111" }}>Installer l'application Ma Maison ?</div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onInstall} style={{ padding: "8px 12px", background: "#2563eb", color: "white", borderRadius: 6, border: "none" }}>
          Installer
        </button>
        <a href="/aide-ios" style={{ display: "inline-flex", alignItems: "center", padding: "8px 12px", background: "transparent", borderRadius: 6, border: "1px solid #ccc", textDecoration: "none", color: "#111" }}>
          Aide iOS
        </a>
        <button onClick={() => setVisible(false)} style={{ padding: "8px 12px", background: "transparent", borderRadius: 6, border: "1px solid #ccc" }}>
          Fermer
        </button>
      </div>
    </div>
  );
}
