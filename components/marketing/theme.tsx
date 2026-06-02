"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeMode = "light" | "dark" | "system";

type Ctx = { mode: ThemeMode; setMode: (m: ThemeMode) => void; dark: boolean };

const ThemeContext = createContext<Ctx | null>(null);
const STORAGE_KEY = "akyra-theme";

function systemPrefersDark() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function MarketingThemeProvider({ children }: { children: ReactNode }) {
  // Défaut sombre (= aura) tant que rien n'est stocké.
  const [mode, setModeState] = useState<ThemeMode>("dark");
  const [dark, setDark] = useState(true);

  // Lecture du choix stocké au montage (évite un mismatch SSR).
  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as ThemeMode | null) ?? "dark";
    setModeState(stored);
  }, []);

  // Recalcule le thème effectif + suit le système si mode === "system".
  useEffect(() => {
    const apply = () => setDark(mode === "dark" || (mode === "system" && systemPrefersDark()));
    apply();
    if (mode !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, [mode]);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    localStorage.setItem(STORAGE_KEY, m);
  };

  return (
    <ThemeContext.Provider value={{ mode, setMode, dark }}>{children}</ThemeContext.Provider>
  );
}

export function useMarketingTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useMarketingTheme must be used within MarketingThemeProvider");
  return ctx;
}
