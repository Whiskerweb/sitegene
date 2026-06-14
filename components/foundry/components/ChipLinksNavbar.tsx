// components/foundry/components/ChipLinksNavbar.tsx
// Extraction (bharat-delhi) : logo étoile, CHAQUE LIEN est une PUCE arrondie à
// contour qui s'allume en accent au survol, CTA accent généreux à droite.
// Chaleureux et coloré (voyage, lifestyle, loisirs). Bloc statique (SmartNav).
import type { CSSProperties } from "react";
import type { Skin } from "@/lib/foundry/types";
import { navLabel, navHref } from "@/lib/foundry/nav";

const LINKS_FALLBACK = ["Accueil", "Destinations", "À propos", "Contact"];

export default function ChipLinksNavbar({ content, skin }: { content: any; skin: Skin }) {
  const root: CSSProperties = {};
  if (skin.accent) root["--c-accent" as keyof CSSProperties] = skin.accent as never;
  const links: unknown[] = Array.isArray(content?.links) && content.links.length ? content.links : LINKS_FALLBACK;
  return (
    <header style={{ ...root, background: "var(--c-surface)" }}>
      <style>{`
        .chipnav-link { border: 1px solid color-mix(in srgb, var(--c-ink) 15%, transparent); transition: border-color .2s, color .2s; }
        .chipnav-link:hover { border-color: var(--c-accent); color: var(--c-accent); }
      `}</style>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <a href="#" className="flex items-center gap-2">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="var(--c-accent)" aria-hidden><path d="M12 0l2.2 7L20.7 3.7 17.4 10.2 24.4 12.4l-7 2.2 3.3 6.5-6.5-3.3L12 24l-2.2-7-6.5 3.3 3.3-6.5L0 12.4l7-2.2L3.7 3.7 10.2 7z" /></svg>
          <span className="text-2xl font-bold" style={{ color: "var(--c-ink)", fontFamily: "var(--font-heading)" }}>{content?.brand ?? "Voyageo"}</span>
        </a>

        <div className="hidden items-center gap-2 lg:flex">
          {links.map((l, i) => (
            <a key={i} href={navHref(l)} className="chipnav-link rounded-[var(--r-pill)] bg-white px-5 py-2 text-[15px] font-medium" style={{ background: "var(--c-card)", color: "var(--c-ink)" }}>{navLabel(l)}</a>
          ))}
        </div>

        <a href="#contact" className="rounded-[var(--r-pill)] px-6 py-2.5 text-[15px] font-semibold text-white shadow-sm transition-transform hover:scale-[1.03]" style={{ background: "var(--c-accent)" }}>{content?.cta ?? "Réserver"}</a>
      </div>
    </header>
  );
}
