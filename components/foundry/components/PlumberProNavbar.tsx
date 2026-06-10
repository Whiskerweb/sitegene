// components/foundry/components/PlumberProNavbar.tsx
// Extraction (Plumber Pro / Aqualis — sites/artisans/plumber-pro/index.html) :
// topbar sombre (tél + horaires + zone d'intervention) + nav sticky claire,
// liens soulignés au survol, tél en pastille ronde + CTA pilule.
import type { CSSProperties } from "react";
import type { Skin } from "@/lib/foundry/types";

const LINKS_FALLBACK = ["Accueil", "À propos", "Services", "Blog", "Contact"];

export default function PlumberProNavbar({ content, skin }: { content: any; skin: Skin }) {
  const root: CSSProperties = {};
  if (skin.accent) root["--c-accent" as keyof CSSProperties] = skin.accent as never;
  if (skin.surface) root["--c-surface" as keyof CSSProperties] = skin.surface as never;
  const links: string[] = Array.isArray(content?.links) && content.links.length ? content.links : LINKS_FALLBACK;
  return (
    <div style={root}>
      <style>{`
        .ppnav-link { position: relative; }
        .ppnav-link::after { content: ""; position: absolute; left: 0; bottom: -4px; width: 0; height: 2px; background: var(--c-accent); transition: width .25s; }
        .ppnav-link:hover::after { width: 100%; }
      `}</style>

      {/* Topbar infos pratiques */}
      <div className="text-xs text-white md:text-sm" style={{ background: "var(--c-ink)" }}>
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-6 px-6 py-2.5">
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4" style={{ color: "var(--c-accent2)" }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 11 19.79 19.79 0 010 2.18 2 2 0 012 0h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 14.92z"/></svg>
            <span>{content?.topbarPhone ?? "(01) 23 45 67 89"}</span>
          </span>
          <span className="hidden items-center gap-2 sm:flex">
            <svg className="h-4 w-4" style={{ color: "var(--c-accent2)" }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            <span>{content?.topbarHours ?? "08h00 – 19h00"}</span>
          </span>
          <span className="hidden items-center gap-2 md:flex">
            <svg className="h-4 w-4" style={{ color: "var(--c-accent2)" }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span>{content?.topbarArea ?? "Trouver une zone d'intervention"}</span>
          </span>
        </div>
      </div>

      {/* Nav (en flux, défile avec la page) */}
      <nav className="relative z-10 border-b" style={{ background: "var(--c-surface)", borderColor: "color-mix(in srgb, var(--c-ink) 10%, transparent)" }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="#" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: "var(--c-accent)" }}>
              <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2c3 4.5 6 8 6 11a6 6 0 11-12 0c0-3 3-6.5 6-11z"/></svg>
            </span>
            <span className="text-xl font-extrabold tracking-tight" style={{ color: "var(--c-ink)", fontFamily: "var(--font-heading)" }}>{content?.brand ?? "Aqualis"}</span>
          </a>
          <div className="hidden items-center gap-8 lg:flex">
            {links.map((l, i) => (
              <a key={i} href="#" className="ppnav-link text-sm font-semibold transition-colors" style={{ color: "color-mix(in srgb, var(--c-ink) 80%, transparent)" }}>{l}</a>
            ))}
          </div>
          <div className="flex items-center gap-5">
            <a href="#" className="hidden items-center gap-2 text-sm font-bold md:flex" style={{ color: "var(--c-ink)" }}>
              <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: "color-mix(in srgb, var(--c-accent2) 14%, transparent)" }}>
                <svg className="h-4 w-4" style={{ color: "var(--c-accent2)" }} fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
              </span>
              <span>{content?.phone ?? "+33 1 80 05 55 76"}</span>
            </a>
            <a href="#contact" className="rounded-[var(--r-pill)] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110" style={{ background: "var(--c-accent)" }}>{content?.cta ?? "Nous contacter"}</a>
          </div>
        </div>
      </nav>
    </div>
  );
}
