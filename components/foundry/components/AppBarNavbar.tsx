"use client";
// components/foundry/components/AppBarNavbar.tsx
// Extraction (saas/health-saas « Healix ») : barre pleine largeur nette, fond
// surface translucide + filet bas, pastille logo ronde encre (anneau), liens
// sobres, CTA plein encre, menu hamburger mobile. Bloc statique (SmartNav gère
// le sticky/scroll). Classique rassurant pour un produit/service en ligne.
import { useState } from "react";
import type { CSSProperties } from "react";
import type { Skin } from "@/lib/foundry/types";
import { navLabel, navHref } from "@/lib/foundry/nav";

const LINKS_FALLBACK = ["Fonctionnalités", "Tarifs", "Avis"];

export default function AppBarNavbar({ content, skin }: { content: any; skin: Skin }) {
  const [open, setOpen] = useState(false);
  const root: CSSProperties = {};
  if (skin.accent) root["--c-accent" as keyof CSSProperties] = skin.accent as never;
  const links: unknown[] = Array.isArray(content?.links) && content.links.length ? content.links : LINKS_FALLBACK;
  const cta: string = content?.cta ?? "Commencer gratuitement";
  return (
    <header style={{ ...root, background: "color-mix(in srgb, var(--c-surface) 90%, transparent)", borderBottom: "1px solid color-mix(in srgb, var(--c-ink) 8%, transparent)", backdropFilter: "blur(8px)" }}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <a href="#" className="flex items-center gap-2 text-xl font-bold" style={{ color: "var(--c-ink)", fontFamily: "var(--font-heading)" }}>
          <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: "var(--c-ink)" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5" stroke="var(--c-surface)" strokeWidth="2" /><circle cx="8" cy="8" r="2" fill="var(--c-surface)" /></svg>
          </span>
          {content?.brand ?? "Healix"}
        </a>

        <nav className="hidden items-center gap-8 text-sm font-medium md:flex" style={{ color: "var(--c-muted)" }}>
          {links.map((l, i) => (
            <a key={i} href={navHref(l)} className="transition-colors hover:text-[color:var(--c-ink)]">{navLabel(l)}</a>
          ))}
        </nav>

        <a href="#contact" className="hidden rounded-[var(--r-pill)] px-5 py-2.5 text-sm font-semibold transition-transform hover:scale-[1.03] md:inline-block" style={{ background: "var(--c-ink)", color: "var(--c-surface)" }}>{cta}</a>

        <button type="button" aria-label="Menu" onClick={() => setOpen((v) => !v)} className="p-2 md:hidden" style={{ color: "var(--c-ink)" }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect y="4" width="22" height="2" rx="1" fill="currentColor" /><rect y="10" width="22" height="2" rx="1" fill="currentColor" /><rect y="16" width="22" height="2" rx="1" fill="currentColor" /></svg>
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-3 px-6 py-4 md:hidden" style={{ background: "var(--c-surface)", borderTop: "1px solid color-mix(in srgb, var(--c-ink) 8%, transparent)" }}>
          {links.map((l, i) => (
            <a key={i} href={navHref(l)} onClick={() => setOpen(false)} className="text-sm font-medium" style={{ color: "var(--c-ink)" }}>{navLabel(l)}</a>
          ))}
          <a href="#contact" onClick={() => setOpen(false)} className="rounded-[var(--r-pill)] px-5 py-2.5 text-center text-sm font-semibold" style={{ background: "var(--c-ink)", color: "var(--c-surface)" }}>{cta}</a>
        </div>
      )}
    </header>
  );
}
