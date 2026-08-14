"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);

    // 1. Respect prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // 2. Display only on first load / session
    const hasSeenSplash =
      typeof window !== "undefined" &&
      sessionStorage.getItem("ma_maison_splash_shown");

    if (hasSeenSplash || prefersReducedMotion) {
      setIsVisible(false);
      return;
    }

    // Mark as shown for current session
    sessionStorage.setItem("ma_maison_splash_shown", "true");
    setIsVisible(true);

    // Auto dismiss after 1.8s max
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  if (!isMounted || !isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="splash-screen"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-between py-16 px-6 bg-[#102281] text-white select-none overflow-hidden"
          aria-hidden="true"
        >
          {/* Top Spacing */}
          <div className="h-8" />

          {/* Centered Content: Logo + Brand Name */}
          <div className="flex flex-col items-center justify-center gap-5 text-center">
            {/* Logo: scale 0.8 -> 1 & fade in 0 -> 1 (~700ms) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center drop-shadow-[0_10px_25px_rgba(0,0,0,0.3)]"
            >
              <Image
                src="/icon-512.png"
                alt="Ma Maison Logo"
                width={112}
                height={112}
                priority
                className="object-contain w-full h-full"
              />
            </motion.div>

            {/* Title: Ma Maison (slight delay) */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
              className="flex items-center gap-1.5"
            >
              <span
                className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white"
                style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
              >
                Ma
              </span>
              <span
                className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#05CBAD]"
                style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
              >
                Maison
              </span>
            </motion.div>
          </div>

          {/* Footer Tagline (delayed fade in) */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
            className="text-center"
          >
            <p className="text-xs sm:text-sm font-medium tracking-widest text-white/70 uppercase">
              By Ismael Service Digital
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
