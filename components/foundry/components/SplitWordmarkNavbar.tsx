// components/foundry/components/SplitWordmarkNavbar.tsx
// Extraction (musicians/hiphop-producer « KAIRO ») : wordmark GÉANT centré, les
// liens répartis de part et d'autre (moitié à gauche, moitié à droite). En-tête
// symétrique à fort caractère — artiste, musicien, marque affirmée. Bloc
// statique (SmartNav gère le sticky/scroll).
import type { CSSProperties } from "react";
import type { Skin } from "@/lib/foundry/types";
import { navLabel, navHref } from "@/lib/foundry/nav";
import { BrandLogo } from "@/components/foundry/BrandLogo";

const LINKS_FALLBACK = ["Sorties", "Concerts", "À propos", "Booking"];

export default function SplitWordmarkNavbar({ content, skin }: { content: any; skin: Skin }) {
  const root: CSSProperties = {};
  if (skin.accent) root["--c-accent" as keyof CSSProperties] = skin.accent as never;
  const links: unknown[] = Array.isArray(content?.links) && content.links.length ? content.links : LINKS_FALLBACK;
  const half = Math.ceil(links.length / 2);
  const left = links.slice(0, half);
  const right = links.slice(half);
  const linkCls = "text-[11px] font-medium uppercase tracking-[0.18em] transition-colors";
  return (
    <header style={{ ...root, background: "var(--c-surface)" }}>
      <style>{`.swnav-link { color: color-mix(in srgb, var(--c-ink) 60%, transparent); } .swnav-link:hover { color: var(--c-accent); }`}</style>
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-6">
        <ul className="hidden items-center gap-7 md:flex">
          {left.map((l, i) => (
            <li key={i}><a href={navHref(l)} className={`swnav-link ${linkCls}`}>{navLabel(l)}</a></li>
          ))}
        </ul>
        <a href="#" className="text-center text-2xl font-extrabold uppercase tracking-[0.12em]" style={{ color: "var(--c-ink)", fontFamily: "var(--font-heading)" }}>
          <BrandLogo
            alt={content?.brand}
            height={34}
            fallback={<>{content?.brand ?? "Kairo"}</>}
          />
        </a>
        <ul className="hidden items-center justify-end gap-7 md:flex">
          {right.map((l, i) => (
            <li key={i}><a href={navHref(l)} className={`swnav-link ${linkCls}`}>{navLabel(l)}</a></li>
          ))}
        </ul>
      </div>
    </header>
  );
}
