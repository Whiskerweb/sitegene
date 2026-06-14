// components/foundry/components/TickerNavbar.tsx
// Extraction (musicians/indie-band « HALCYON ») : en-tête en BANDEAU DÉFILANT
// (marquee) — le nom et les liens passent en boucle continue, séparés par des
// points accent. En-tête vivant et audacieux : événement, groupe, site éditorial.
// CSS pur (pas de JS) ; bloc statique (SmartNav gère le sticky/scroll).
import type { CSSProperties } from "react";
import type { Skin } from "@/lib/foundry/types";
import { navLabel, navHref } from "@/lib/foundry/nav";
import { BrandLogo, useBrandLogo } from "@/components/foundry/BrandLogo";

const LINKS_FALLBACK = ["Concerts", "Sorties", "Booking"];

export default function TickerNavbar({ content, skin }: { content: any; skin: Skin }) {
  const root: CSSProperties = {};
  if (skin.accent) root["--c-accent" as keyof CSSProperties] = skin.accent as never;
  const links: unknown[] = Array.isArray(content?.links) && content.links.length ? content.links : LINKS_FALLBACK;
  const brand: string = content?.brand ?? "Halcyon";
  // Avec un logo, on l'ancre en lockup fixe à gauche ; le ticker continue à droite.
  // Sans logo, le bandeau défilant reste pur (le nom défile dans la séquence).
  const logo = useBrandLogo();

  // Une séquence = marque (non cliquable) + liens ; on la duplique pour la boucle.
  const seq = (
    <span className="flex shrink-0 items-center">
      <span className="px-5 font-bold uppercase tracking-[0.2em]" style={{ color: "var(--c-ink)" }}>{brand}</span>
      <span style={{ color: "var(--c-accent)" }}>·</span>
      {links.map((l, i) => (
        <span key={i} className="flex items-center">
          <a href={navHref(l)} className="px-5 uppercase tracking-[0.18em] transition-opacity hover:opacity-60" style={{ color: "color-mix(in srgb, var(--c-ink) 60%, transparent)" }}>{navLabel(l)}</a>
          <span style={{ color: "var(--c-accent)" }}>·</span>
        </span>
      ))}
    </span>
  );

  return (
    <header style={{ ...root, background: "var(--c-surface)", borderBottom: "1px solid color-mix(in srgb, var(--c-ink) 10%, transparent)" }}>
      <style>{`
        @keyframes sg-nav-ticker { to { transform: translateX(-50%); } }
        .sgnav-ticker-track { animation: sg-nav-ticker 24s linear infinite; }
        .sgnav-ticker-track:hover { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) { .sgnav-ticker-track { animation: none; } }
      `}</style>
      <div className="flex h-10 items-center overflow-hidden">
        {logo && (
          <a href="#" className="flex shrink-0 items-center pl-5 pr-4" style={{ borderRight: "1px solid color-mix(in srgb, var(--c-ink) 12%, transparent)" }}>
            <BrandLogo alt={brand} height={22} fallback={null} />
          </a>
        )}
        <div className="sgnav-ticker-track flex items-center whitespace-nowrap text-[11px] font-medium">
          {seq}
          <span aria-hidden>{seq}</span>
        </div>
      </div>
    </header>
  );
}
