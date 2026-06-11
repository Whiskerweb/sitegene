// components/foundry/components/PillMenuNavbar.tsx
// Extraction (elearning/elearni) : logo à pastille à gauche, LIENS REGROUPÉS
// DANS UNE PILULE pleine (encre, texte clair) au centre, CTA accent à droite.
// La pilule de liens est la signature. Bloc statique (SmartNav gère le scroll).
import type { CSSProperties } from "react";
import type { Skin } from "@/lib/foundry/types";
import { navLabel, navHref } from "@/lib/foundry/nav";

const LINKS_FALLBACK = ["Accueil", "Cours", "Méthode", "Tarifs"];

export default function PillMenuNavbar({ content, skin }: { content: any; skin: Skin }) {
  const root: CSSProperties = {};
  if (skin.accent) root["--c-accent" as keyof CSSProperties] = skin.accent as never;
  const links: unknown[] = Array.isArray(content?.links) && content.links.length ? content.links : LINKS_FALLBACK;
  return (
    <header style={{ ...root, background: "var(--c-surface)" }}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 md:px-8">
        <a href="#" className="flex items-center gap-2" style={{ color: "var(--c-ink)" }}>
          <span className="flex h-7 w-7 items-center justify-center rounded-full" style={{ background: "var(--c-accent)" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--c-on-accent)" strokeWidth="2"><path d="M22 10L12 5 2 10l10 5 10-5z" /><path d="M6 12v5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-5" /></svg>
          </span>
          <span className="text-xl font-bold tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>{content?.brand ?? "Elearni"}</span>
        </a>

        <ul className="hidden items-center gap-7 rounded-[var(--r-pill)] px-7 py-3 text-[13px] font-medium md:flex" style={{ background: "var(--c-ink)" }}>
          {links.map((l, i) => (
            <li key={i}><a href={navHref(l)} className="transition-opacity hover:opacity-100" style={{ color: "color-mix(in srgb, var(--c-surface) 85%, transparent)" }}>{navLabel(l)}</a></li>
          ))}
        </ul>

        <a href="#contact" className="hidden rounded-[var(--r-pill)] px-6 py-3 text-[13px] font-semibold text-white transition-transform hover:-translate-y-0.5 md:inline-block" style={{ background: "var(--c-accent)" }}>{content?.cta ?? "S'inscrire"}</a>
      </div>
    </header>
  );
}
