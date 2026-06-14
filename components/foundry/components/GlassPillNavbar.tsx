// components/foundry/components/GlassPillNavbar.tsx
// Extraction (saas/analytics-saas « Northpeak » + wizzchat) : pilule flottante
// centrée, verre dépoli (backdrop-blur + fond surface translucide), pastille
// logo en dégradé accent→accent2, liens au centre, CTA pilule pleine à droite.
// Bloc statique : SmartNav (Assembler) gère le sticky/scroll.
import type { CSSProperties } from "react";
import type { Skin } from "@/lib/foundry/types";
import { navLabel, navHref } from "@/lib/foundry/nav";
import { BrandLogo } from "@/components/foundry/BrandLogo";

const LINKS_FALLBACK = ["Fonctionnalités", "Tarifs", "FAQ"];

export default function GlassPillNavbar({ content, skin }: { content: any; skin: Skin }) {
  const root: CSSProperties = {};
  if (skin.accent) root["--c-accent" as keyof CSSProperties] = skin.accent as never;
  const links: unknown[] = Array.isArray(content?.links) && content.links.length ? content.links : LINKS_FALLBACK;
  const brand: string = content?.brand ?? "Northpeak";
  return (
    <div className="flex justify-center px-4 pt-4" style={root}>
      <nav
        className="flex w-full max-w-3xl items-center justify-between rounded-[var(--r-pill)] border px-3 py-2 backdrop-blur-xl"
        style={{
          background: "color-mix(in srgb, var(--c-surface) 72%, transparent)",
          borderColor: "color-mix(in srgb, var(--c-ink) 9%, transparent)",
          boxShadow: "0 10px 40px -12px color-mix(in srgb, var(--c-ink) 30%, transparent)",
        }}
      >
        <a href="#" className="flex items-center gap-2 pl-2">
          <BrandLogo
            alt={brand}
            height={28}
            fallback={
              <>
                <span
                  className="grid h-7 w-7 place-items-center rounded-lg text-xs font-bold"
                  style={{ background: "linear-gradient(135deg, var(--c-accent), var(--c-accent2))", color: "var(--c-on-accent)" }}
                >
                  {brand.trim().charAt(0).toUpperCase() || "N"}
                </span>
                <span className="text-lg font-bold tracking-tight" style={{ color: "var(--c-ink)", fontFamily: "var(--font-heading)" }}>{brand}</span>
              </>
            }
          />
        </a>
        <ul className="hidden items-center gap-6 text-sm font-medium md:flex" style={{ color: "var(--c-muted)" }}>
          {links.map((l, i) => (
            <li key={i}><a href={navHref(l)} className="transition-colors hover:text-[color:var(--c-ink)]">{navLabel(l)}</a></li>
          ))}
        </ul>
        <a
          href="#contact"
          className="inline-flex items-center gap-2 rounded-[var(--r-pill)] px-4 py-2 text-sm font-semibold transition-transform hover:scale-[1.03]"
          style={{ background: "linear-gradient(135deg, var(--c-accent), var(--c-accent2))", color: "var(--c-on-accent)" }}
        >
          {content?.cta ?? "Demander une démo"}
        </a>
      </nav>
    </div>
  );
}
