"use client";

import { useTheme } from "@/components/providers/theme-provider";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
  showLabel?: boolean;
};

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const { theme, setTheme, isDark } = useTheme();

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Activer le mode clair" : "Activer le mode sombre"}
      title={isDark ? "Passer au mode clair" : "Passer au mode sombre"}
      className={cn(
        "relative inline-flex items-center justify-center rounded-xl p-2 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-slate-800 dark:hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
        className
      )}
    >
      <div className="relative h-5 w-5 flex items-center justify-center">
        <Sun className={cn(
          "h-5 w-5 transition-all duration-300 transform",
          isDark ? "rotate-0 scale-100 opacity-100 text-amber-400" : "-rotate-90 scale-0 opacity-0 absolute"
        )} />
        <Moon className={cn(
          "h-5 w-5 transition-all duration-300 transform",
          isDark ? "rotate-90 scale-0 opacity-0 absolute" : "rotate-0 scale-100 opacity-100 text-slate-700"
        )} />
      </div>

      {showLabel && (
        <span className="ml-2 text-xs font-medium">
          {isDark ? "Mode clair" : "Mode sombre"}
        </span>
      )}
    </button>
  );
}
