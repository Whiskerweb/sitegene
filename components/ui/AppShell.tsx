"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import type { NavItem } from "./NavItem";
import { IconClose } from "./icons";
import { DashThemeToggle, type DashThemeMode } from "./DashThemeToggle";

const THEME_KEY = "akyra-dash-theme";

function useDashTheme() {
  // Défaut sombre (= DA marketing). Le mode clair reste l'ancien rendu.
  const [mode, setModeState] = useState<DashThemeMode>("dark");
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const stored = (localStorage.getItem(THEME_KEY) as DashThemeMode | null) ?? "dark";
    setModeState(stored);
  }, []);

  useEffect(() => {
    const apply = () =>
      setDark(
        mode === "dark" ||
          (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches),
      );
    apply();
    if (mode !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, [mode]);

  const setMode = (m: DashThemeMode) => {
    setModeState(m);
    localStorage.setItem(THEME_KEY, m);
  };

  return { mode, setMode, dark };
}

export function AppShell({
  nav,
  titleMap,
  right,
  roleLabel,
  footer,
  children,
}: {
  nav: NavItem[];
  titleMap: Record<string, string>;
  right?: ReactNode;
  roleLabel?: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { mode, setMode, dark } = useDashTheme();
  const pathname = usePathname();
  const title =
    titleMap[pathname] ??
    Object.entries(titleMap)
      .filter(([k]) => pathname.startsWith(k))
      .sort((a, b) => b[0].length - a[0].length)[0]?.[1] ??
    "";

  return (
    <div
      className={`dash ${dark ? "dark" : ""} font-archivo relative min-h-screen overflow-x-hidden cloud-bg text-slate`}
    >
      {/* Blobs d'ambiance (aérien) */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="blob blob-blue absolute -left-32 -top-24 h-[420px] w-[420px]" />
        <div className="blob blob-mint absolute -right-28 top-1/3 h-[360px] w-[360px]" />
      </div>

      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] border-r border-sky-300 bg-white/60 backdrop-blur-md lg:block">
        <Sidebar items={nav} roleLabel={roleLabel} footer={footer} />
      </aside>

      {/* Drawer mobile */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-night/30 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-[280px] border-r border-sky-300 bg-sky-50">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-4 grid h-8 w-8 place-items-center rounded-lg text-slate hover:bg-sky-100"
              aria-label="Fermer"
            >
              <IconClose size={18} />
            </button>
            <Sidebar
              items={nav}
              roleLabel={roleLabel}
              footer={footer}
              onNavigate={() => setOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Colonne principale */}
      <div className="relative z-10 lg:pl-[260px]">
        <Topbar
          title={title}
          right={
            <>
              <DashThemeToggle mode={mode} setMode={setMode} />
              {right}
            </>
          }
          onMenu={() => setOpen(true)}
        />
        <main className="mx-auto max-w-[1040px] px-5 py-8 md:px-8 md:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
