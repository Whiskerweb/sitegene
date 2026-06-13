// components/foundry/components/InkBarNavbar.tsx
// Extraction (musicians/dj-electro, jazz-vocalist, podcast-audio) : barre encre
// pleine, texte clair, liens discrets, CTA pilule À CONTOUR qui s'inverse au
// survol (fond clair / texte encre). En-tête sombre et premium — musicien,
// photographe, club, marque nocturne. Bloc statique (SmartNav gère le scroll).
import type { CSSProperties } from "react";
import type { Skin } from "@/lib/foundry/types";
import { navLabel, navHref } from "@/lib/foundry/nav";

const LINKS_FALLBACK = ["À propos", "Galerie", "Avis", "Contact"];

export default function InkBarNavbar({ content, skin }: { content: any; skin: Skin }) {
  const root: CSSProperties = {};
  if (skin.accent) root["--c-accent" as keyof CSSProperties] = skin.accent as never;
  const links: unknown[] = Array.isArray(content?.links) && content.links.length ? content.links : LINKS_FALLBACK;
  return (
    <header style={{ ...root, background: "var(--c-panel)" }}>
      <style>{`
        .inknav-link { color: color-mix(in srgb, var(--c-on-panel) 65%, transparent); transition: color .2s; }
        .inknav-link:hover { color: var(--c-on-panel); }
        .inknav-cta { border: 1px solid color-mix(in srgb, var(--c-on-panel) 40%, transparent); color: var(--c-on-panel); transition: background .25s, color .25s; }
        .inknav-cta:hover { background: var(--c-on-panel); color: var(--c-panel); }
      `}</style>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <a href="#" className="text-lg font-bold tracking-tight" style={{ color: "var(--c-on-panel)", fontFamily: "var(--font-heading)" }}>{content?.brand ?? "Marina Cole"}</a>

        <nav className="hidden items-center gap-8 text-[14px] md:flex">
          {links.map((l, i) => (
            <a key={i} href={navHref(l)} className="inknav-link">{navLabel(l)}</a>
          ))}
        </nav>

        <a href="#contact" className="inknav-cta rounded-[var(--r-pill)] px-5 py-2 text-[14px] font-medium">{content?.cta ?? "Me contacter"}</a>
      </div>
    </header>
  );
}
