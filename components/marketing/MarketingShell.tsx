"use client";

import { MarketingThemeProvider, useMarketingTheme } from "./theme";
import MarketingNav from "./MarketingNav";
import MarketingFooter from "./MarketingFooter";

function ShellInner({ children }: { children: React.ReactNode }) {
  const { dark } = useMarketingTheme();
  return (
    <div id="top" className={`akyra relative min-h-screen ${dark ? "dark" : ""}`}>
      {/* Quadrillage : lignes verticales encadrant la colonne centrale */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 flex justify-center">
        <div className="h-full w-full max-w-6xl border-l border-r border-[rgb(var(--m-overlay)/0.05)]" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <MarketingNav />
        <main className="flex-grow pt-[60px]">{children}</main>
        <MarketingFooter />
      </div>
    </div>
  );
}

/** Surface marketing : provider de thème + chrome (nav/footer) + quadrillage. */
export default function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <MarketingThemeProvider>
      <ShellInner>{children}</ShellInner>
    </MarketingThemeProvider>
  );
}
