// components/foundry/components/PlumberModernNavbar.tsx
// Extraction (Plumber Modern / BlueDrop — sites/artisans/plumber-modern/index.html) :
// nav transparente posée en absolu SUR le hero coloré qui suit (texte blanc),
// logo rond accent2, liens soulignés au survol, CTA pilule encre avec point accent2.
import type { CSSProperties } from "react";
import type { Skin } from "@/lib/foundry/types";

const LINKS_FALLBACK = ["Accueil", "À propos", "Services", "Contact"];

export default function PlumberModernNavbar({ content, skin }: { content: any; skin: Skin }) {
  const root: CSSProperties = {};
  if (skin.accent) root["--c-accent" as keyof CSSProperties] = skin.accent as never;
  const links: string[] = Array.isArray(content?.links) && content.links.length ? content.links : LINKS_FALLBACK;
  return (
    <header className="absolute inset-x-0 top-0 z-50" style={root}>
      <style>{`
        .pmnav-link { position: relative; }
        .pmnav-link::after { content: ""; position: absolute; left: 0; bottom: -4px; width: 0; height: 2px; background: var(--c-accent2); transition: width .25s; }
        .pmnav-link:hover::after { width: 100%; }
      `}</style>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 pt-6">
        <a href="#" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: "var(--c-accent2)" }}>
            <svg className="h-5 w-5" style={{ color: "var(--c-ink)" }} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>
          </span>
          <span className="text-xl font-semibold tracking-tight text-white" style={{ fontFamily: "var(--font-heading)" }}>{content?.brand ?? "BlueDrop"}</span>
        </a>
        <nav className="hidden items-center gap-9 md:flex">
          {links.map((l, i) => (
            <a key={i} href="#" className="pmnav-link text-sm font-medium text-white/85 hover:text-white">{l}</a>
          ))}
        </nav>
        <a href="#contact" className="hidden items-center gap-2 rounded-[var(--r-pill)] px-5 py-2.5 text-sm font-medium text-white transition-all hover:brightness-110 sm:inline-flex" style={{ background: "var(--c-ink)" }}>
          <span className="h-2 w-2 rounded-full" style={{ background: "var(--c-accent2)" }} />
          <span>{content?.cta ?? "Appelez-nous : 01 86 95 99 43"}</span>
        </a>
      </div>
    </header>
  );
}
