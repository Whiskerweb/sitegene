"use client";
// components/foundry/components/WordmarkNavbar.tsx
// Extraction (photographers/potozon) : gros WORDMARK gras précédé d'un losange
// stylisé, liens en gras à droite, hamburger mobile qui se mue en croix +
// panneau déroulant arrondi. En-tête typographique affirmé — photographe,
// créatif, marque qui assume son nom. Bloc statique (SmartNav gère le scroll).
import { useState } from "react";
import type { CSSProperties } from "react";
import type { Skin } from "@/lib/foundry/types";
import { navLabel, navHref } from "@/lib/foundry/nav";
import { BrandLogo } from "@/components/foundry/BrandLogo";

const LINKS_FALLBACK = ["Accueil", "Galerie", "À propos", "Contact"];

export default function WordmarkNavbar({ content, skin }: { content: any; skin: Skin }) {
  const [open, setOpen] = useState(false);
  const root: CSSProperties = {};
  if (skin.accent) root["--c-accent" as keyof CSSProperties] = skin.accent as never;
  const links: unknown[] = Array.isArray(content?.links) && content.links.length ? content.links : LINKS_FALLBACK;
  const bar = "h-0.5 w-7 transition-all duration-300";
  return (
    <nav className="relative" style={{ ...root, background: "var(--c-surface)" }}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="#" className="flex items-center gap-1.5">
          <BrandLogo
            alt={content?.brand}
            height={32}
            fallback={
              <>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M5 5l6 7-6 7M19 5l-6 7 6 7" stroke="var(--c-ink)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--c-ink)", fontFamily: "var(--font-heading)" }}>{content?.brand ?? "Potozon"}</span>
              </>
            }
          />
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((l, i) => (
            <a key={i} href={navHref(l)} className="text-base font-semibold transition-opacity hover:opacity-60" style={{ color: "var(--c-ink)" }}>{navLabel(l)}</a>
          ))}
        </div>

        <button
          type="button"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="-mr-2 flex h-11 w-11 flex-col items-center justify-center gap-1.5 md:hidden"
        >
          <span className={bar} style={{ background: "var(--c-ink)", transform: open ? "translateY(8px) rotate(45deg)" : "none" }} />
          <span className={bar} style={{ background: "var(--c-ink)", opacity: open ? 0 : 1 }} />
          <span className={bar} style={{ background: "var(--c-ink)", transform: open ? "translateY(-8px) rotate(-45deg)" : "none" }} />
        </button>
      </div>

      {open && (
        <div className="absolute left-4 right-4 top-[calc(100%+8px)] z-50 rounded-3xl border p-3 shadow-2xl md:hidden" style={{ background: "var(--c-surface)", borderColor: "color-mix(in srgb, var(--c-ink) 10%, transparent)" }}>
          <div className="flex flex-col">
            {links.map((l, i) => (
              <a key={i} href={navHref(l)} onClick={() => setOpen(false)} className="flex min-h-[48px] items-center rounded-2xl px-4 text-lg font-bold" style={{ color: "var(--c-ink)" }}>{navLabel(l)}</a>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
