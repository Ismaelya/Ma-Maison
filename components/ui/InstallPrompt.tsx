"use client";

import React, { useEffect, useState } from "react";
import { Download, X, Share } from "lucide-react";

type DeferredPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const STORAGE_KEY = "ma_maison_pwa_prompt_dismissed";

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandaloneMode(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
    (navigator as any)["standalone"] === true
  );
}

export default function InstallPrompt(): React.ReactElement | null {
  const [deferredPrompt, setDeferredPrompt] = useState<DeferredPrompt | null>(null);
  const [visible, setVisible] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if already in standalone mode or already dismissed/shown once
    if (isInStandaloneMode()) return;
    const isDismissed = localStorage.getItem(STORAGE_KEY) === "true";
    if (isDismissed) return;

    const onBeforeInstall = (e: Event) => {
      try {
        (e as any).preventDefault();
      } catch {}
      if (localStorage.getItem(STORAGE_KEY) === "true") return;
      setDeferredPrompt(e as DeferredPrompt);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall as EventListener);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // iOS: show instructions if not in standalone and prompt hasn't been dismissed
    if (isIos() && !isInStandaloneMode() && !isDismissed) {
      setShowIosInstructions(true);
      setVisible(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall as EventListener);
    };
  }, []);

  const dismissPrompt = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {}
    setVisible(false);
    setShowIosInstructions(false);
  };

  const onInstall = async () => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {}
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        await deferredPrompt.userChoice;
      } catch {}
    }
    setVisible(false);
    setDeferredPrompt(null);
  };

  if (!visible) return null;

  if (showIosInstructions) {
    return (
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50 p-4 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xl transition-all duration-300">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            <Share className="h-4 w-4 text-[var(--color-primary-text)] shrink-0" />
            <span>Installer Ma Maison sur iOS</span>
          </div>
          <button
            onClick={dismissPrompt}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
          Pour installer l&apos;application sur votre iPhone ou iPad : appuyez sur le bouton{" "}
          <strong>Partager</strong> dans Safari, puis choisissez <strong>Ajouter à l&apos;écran d&apos;accueil</strong>.
        </p>
        <div className="flex justify-end">
          <button
            onClick={dismissPrompt}
            className="px-3.5 py-1.5 text-xs font-medium text-white bg-primary hover:bg-primary/90 rounded-xl shadow-sm transition-colors"
          >
            J&apos;ai compris
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50 p-4 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-[var(--color-primary-text)]">
            <Download className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Installer l&apos;application Ma Maison ?
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Accès rapide et expérience optimisée
            </p>
          </div>
        </div>
        <button
          onClick={dismissPrompt}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 flex items-center justify-end gap-2">
        <a
          href="/aide-ios"
          className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
        >
          Aide iOS
        </a>
        <button
          onClick={dismissPrompt}
          className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
        >
          Plus tard
        </button>
        <button
          onClick={onInstall}
          className="px-4 py-1.5 text-xs font-semibold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-sm transition-colors"
        >
          Installer
        </button>
      </div>
    </div>
  );
}

