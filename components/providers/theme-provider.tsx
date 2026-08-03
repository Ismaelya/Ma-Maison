"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
};

const initialState: ThemeProviderState = {
  theme: "light",
  setTheme: () => null,
  isDark: false,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "ma-maison-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [isDark, setIsDark] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Temporarily force light theme to avoid dark-mode visibility regressions.
    const forcedTheme: Theme = "light";
    try {
      localStorage.setItem(storageKey, forcedTheme);
    } catch {
      // ignore
    }
    setThemeState(forcedTheme);
  }, [defaultTheme, storageKey]);

  useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    let effectiveThemeIsDark = false;

    if (theme === "system") {
      const systemThemeIsDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      effectiveThemeIsDark = systemThemeIsDark;
      root.classList.add(systemThemeIsDark ? "dark" : "light");
    } else {
      effectiveThemeIsDark = theme === "dark";
      root.classList.add(theme);
    }

    setIsDark(effectiveThemeIsDark);
    localStorage.setItem(storageKey, theme);
  }, [theme, storageKey, mounted]);

  // Handle system preference changes when system mode is selected
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const root = window.document.documentElement;
      root.classList.remove("light", "dark");
      const systemThemeIsDark = mediaQuery.matches;
      root.classList.add(systemThemeIsDark ? "dark" : "light");
      setIsDark(systemThemeIsDark);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      setThemeState(newTheme);
    },
    isDark,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
