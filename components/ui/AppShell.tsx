"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import type { NavItem } from "./NavItem";
import { IconClose } from "./icons";
import { MarketingThemeProvider } from "@/components/marketing/theme";

const SIDEBAR_KEY = "akyra_sidebar_collapsed";

type Props = {
  nav: NavItem[];
  titleMap: Record<string, string>;
  right?: ReactNode;
  roleLabel?: string;
  footer?: ReactNode;
  children: ReactNode;
};

function Shell({ nav, titleMap, right, roleLabel, footer, children }: Props) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const pathname = usePathname();
  const title =
    titleMap[pathname] ??
    Object.entries(titleMap)
      .filter(([k]) => pathname.startsWith(k))
      .sort((a, b) => b[0].length - a[0].length)[0]?.[1] ??
    "";

  // Restaure l'état réduit/déplié de la sidebar (persisté côté client).
  useEffect(() => {
    const saved = localStorage.getItem(SIDEBAR_KEY);
    if (saved !== null) setCollapsed(saved === "true");
    setHydrated(true);
  }, []);

  const toggleCollapse = () => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(SIDEBAR_KEY, String(next));
      } catch {
        /* localStorage indisponible : on garde l'état en mémoire */
      }
      return next;
    });
  };

  return (
    // Skin Traaaction (clair-only) : `.akyra.dash` remappe les tokens, le fond
    // application est #FAFAFA et le texte hérite d'Inter (police du <body>).
    <div className="akyra dash relative min-h-screen overflow-x-hidden bg-[rgb(var(--m-page))] text-[rgb(var(--m-muted))]">
      {/* Sidebar desktop (rétractable) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden border-r border-gray-200/70 bg-[#fafafa] transition-[width] duration-300 ease-out lg:block ${
          collapsed ? "w-[72px]" : "w-[248px]"
        }`}
      >
        <Sidebar
          items={nav}
          roleLabel={roleLabel}
          footer={footer}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
        />
      </aside>

      {/* Drawer mobile (toujours déplié) */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-gray-900/30 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-[280px] border-r border-gray-200/70 bg-[#fafafa] shadow-xl">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-4 z-10 grid h-8 w-8 place-items-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900"
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

      {/* Colonne principale — décalée selon l'état de la sidebar */}
      <div
        className={`relative z-10 transition-[padding] duration-300 ease-out ${
          hydrated
            ? collapsed
              ? "lg:pl-[72px]"
              : "lg:pl-[248px]"
            : "lg:pl-[248px]"
        }`}
      >
        <Topbar
          title={title}
          right={right}
          onMenu={() => setOpen(true)}
          onToggleSidebar={toggleCollapse}
          collapsed={collapsed}
        />
        <main className="mx-auto max-w-[1200px] px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export function AppShell(props: Props) {
  return (
    <MarketingThemeProvider>
      <Shell {...props} />
    </MarketingThemeProvider>
  );
}
