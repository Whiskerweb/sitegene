"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import type { NavItem } from "./NavItem";
import { IconClose } from "./icons";
import { MarketingThemeProvider, useMarketingTheme } from "@/components/marketing/theme";
import ThemeToggle from "@/components/marketing/ThemeToggle";

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
  const { dark } = useMarketingTheme();
  const pathname = usePathname();
  const title =
    titleMap[pathname] ??
    Object.entries(titleMap)
      .filter(([k]) => pathname.startsWith(k))
      .sort((a, b) => b[0].length - a[0].length)[0]?.[1] ??
    "";

  return (
    <div
      className={`akyra dash ${dark ? "dark" : ""} font-archivo relative min-h-screen overflow-x-hidden bg-[rgb(var(--m-page))] text-[rgb(var(--m-muted))]`}
    >
      {/* Halo d'ambiance violet, discret */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[380px] bg-[radial-gradient(60%_100%_at_50%_0%,rgba(109,74,255,0.10),transparent_72%)]"
      />

      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] border-r border-[rgb(var(--m-line))] bg-[rgb(var(--m-page))] lg:block">
        <Sidebar items={nav} roleLabel={roleLabel} footer={footer} />
      </aside>

      {/* Drawer mobile */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-[280px] border-r border-[rgb(var(--m-line))] bg-[rgb(var(--m-page))]">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-4 grid h-8 w-8 place-items-center rounded-lg text-[rgb(var(--m-muted))] hover:bg-[rgb(var(--m-overlay)/0.06)]"
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
              <ThemeToggle />
              {right}
            </>
          }
          onMenu={() => setOpen(true)}
        />
        <main className="mx-auto max-w-[1080px] px-5 py-8 md:px-8 md:py-10">{children}</main>
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
