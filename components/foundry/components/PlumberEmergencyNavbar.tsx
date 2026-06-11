// (Plumber Emergency / RAPIDPLOMB) Nav sticky blanche — logo rond accent, liens
// soulignés accent2 au survol, CTA contour encre qui s'inverse au survol.
import type { CSSProperties } from "react";
import type { Skin } from "@/lib/foundry/types";
import { navLabel, navHref } from "@/lib/foundry/nav";

const LINKS_FALLBACK = ["Services", "Blog", "Contact"];

export default function PlumberEmergencyNavbar({ content, skin }: { content: any; skin: Skin }) {
  const root: CSSProperties = {};
  if (skin.accent) root["--c-accent" as keyof CSSProperties] = skin.accent as never;
  const links: unknown[] = Array.isArray(content?.links) && content.links.length ? content.links : LINKS_FALLBACK;
  return (
    <nav className="penav relative z-10" style={root}>
      <style>{`
        .penav { background: var(--c-surface); border-bottom: 1px solid color-mix(in srgb, var(--c-ink) 10%, transparent); }
        .penav-link { position: relative; }
        .penav-link::after { content: ""; position: absolute; left: 0; bottom: -4px; width: 0; height: 2px; background: var(--c-accent2); transition: width .25s; }
        .penav-link:hover::after { width: 100%; }
        .penav-cta:hover { background: var(--c-ink); color: var(--c-bg); }
      `}</style>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="#" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: "var(--c-accent)" }}>
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7l4-4 3 3-2 2 5 5 2-2 3 3-4 4-3-3 1-1-5-5-1 1z"/>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 7l3-3 3 3-3 3"/>
            </svg>
          </span>
          <span className="text-xl font-bold tracking-tight" style={{ color: "var(--c-ink)", fontFamily: "var(--font-heading)" }}>{content?.brand ?? "RapidPlomb"}</span>
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((l, i) => (
            <a key={i} href={navHref(l)} className="penav-link text-sm font-medium transition-colors" style={{ color: "var(--c-muted)" }}>{navLabel(l)}</a>
          ))}
        </div>

        <a href="#contact" className="penav-cta inline-flex items-center gap-2 rounded-[var(--r-pill)] border px-5 py-2.5 text-sm font-semibold transition-all" style={{ borderColor: "var(--c-ink)", color: "var(--c-ink)" }}>
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
          <span>{content?.cta ?? "Appeler : 01 86 95 99 43"}</span>
        </a>
      </div>
    </nav>
  );
}
