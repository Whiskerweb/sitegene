"use client";
// components/foundry/components/StudioClockNavbar.tsx
// Extraction (portfolio/creative-portfolio + studio-portfolio) : en-tête éditorial
// ultra-minimal — wordmark et liens en CAPITALES espacées, HORLOGE LOCALE vivante
// à droite (heure du visiteur, chiffres tabulaires). Studio créatif, direction
// artistique, portfolio. Bloc statique (SmartNav gère le sticky/scroll).
// NB : on n'utilise PAS mix-blend-mode (isolé par le contexte d'empilement de
// SmartNav) — texte encre sur la surface, lisible dans toutes les DA.
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { Skin } from "@/lib/foundry/types";
import { navLabel, navHref } from "@/lib/foundry/nav";
import { BrandLogo } from "@/components/foundry/BrandLogo";

const LINKS_FALLBACK = ["Projets", "Studio", "Contact"];
const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

export default function StudioClockNavbar({ content, skin }: { content: any; skin: Skin }) {
  const [clock, setClock] = useState("--:--:--");
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setClock(`${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const root: CSSProperties = {};
  if (skin.accent) root["--c-accent" as keyof CSSProperties] = skin.accent as never;
  const links: unknown[] = Array.isArray(content?.links) && content.links.length ? content.links : LINKS_FALLBACK;
  return (
    <header style={{ ...root, background: "var(--c-surface)" }}>
      <style>{`.scnav-link { transition: opacity .2s; } .scnav-link:hover { opacity: .5; }`}</style>
      <div className="flex items-center justify-between px-6 py-6 md:px-10" style={{ color: "var(--c-ink)" }}>
        <a href="#" className="text-[13px] font-bold uppercase tracking-[0.14em]">
          <BrandLogo
            alt={content?.brand}
            height={24}
            fallback={<>{content?.brand ?? "Mörk Studio"}</>}
          />
        </a>
        <ul className="hidden gap-8 text-[13px] uppercase tracking-[0.04em] md:flex">
          {links.map((l, i) => (
            <li key={i}><a href={navHref(l)} className="scnav-link">{navLabel(l)}</a></li>
          ))}
        </ul>
        <div className="text-[12px] tracking-[0.08em] tabular-nums" style={{ color: "color-mix(in srgb, var(--c-ink) 60%, transparent)" }}>
          LOCAL / {clock}
        </div>
      </div>
    </header>
  );
}
