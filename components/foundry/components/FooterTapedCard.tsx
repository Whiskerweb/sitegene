// components/foundry/components/FooterTapedCard.tsx
// Import adapté (style « ActivationLed ») : footer en CARTE arrondie « scotchée »
// (bouts de ruban dans les coins), marque + accroche à gauche, colonnes de liens
// à droite, barre basse copyright + réseaux sociaux. Liens configurables (comme
// footer-columns). CSS vars only ; rendable serveur.
import type { CSSProperties } from "react";
import type { Skin } from "@/lib/foundry/types";
import { navLabel, navHref } from "@/lib/foundry/nav";
import { BrandLogo } from "@/components/foundry/BrandLogo";
import SocialIcon from "./SocialIcon";

export default function FooterTapedCard({ content, skin }: { content: any; skin: Skin }) {
  const root: CSSProperties = {};
  if (skin.accent) root["--c-accent" as keyof CSSProperties] = skin.accent as never;
  const columns: Array<{ title?: string; links?: unknown[] }> = Array.isArray(content?.columns) ? content.columns : [];
  const socials: Array<{ platform?: string; href?: string }> = Array.isArray(content?.socials) ? content.socials : [];
  const brand: string = content?.brand ?? "Marque";
  const muted = "color-mix(in srgb, var(--c-ink) 55%, transparent)";
  const tape = "color-mix(in srgb, var(--c-ink) 13%, transparent)";

  return (
    <footer className="px-5 py-10" style={{ ...root, background: "var(--c-surface)" }}>
      <div className="mx-auto max-w-5xl">
        <div className="relative rounded-3xl px-6 py-10 md:px-10" style={{ background: "var(--c-card)" }}>
          {/* Bouts de ruban adhésif */}
          <span className="absolute -top-2 left-8 hidden h-6 w-20 -rotate-6 rounded-sm md:block" style={{ background: tape }} />
          <span className="absolute -top-2 right-8 hidden h-6 w-20 rotate-6 rounded-sm md:block" style={{ background: tape }} />

          <div className="flex flex-col gap-8 md:flex-row md:justify-between md:gap-12">
            <div className="md:max-w-xs">
              <BrandLogo
                alt={brand}
                height={38}
                fallback={
                  <span className="text-2xl font-extrabold" style={{ color: "var(--c-ink)", fontFamily: "var(--font-heading)" }}>{brand}</span>
                }
              />
              {content?.tagline && <p className="mt-2 text-sm leading-relaxed" style={{ color: muted }}>{content.tagline}</p>}
            </div>

            <div className="flex flex-wrap gap-x-12 gap-y-8">
              {columns.map((col, i) => (
                <div key={i} className="flex flex-col gap-3">
                  {col.title && <h4 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "color-mix(in srgb, var(--c-ink) 42%, transparent)" }}>{col.title}</h4>}
                  <div className="flex flex-col gap-2">
                    {(Array.isArray(col.links) ? col.links : []).map((l, j) => (
                      <a key={j} href={navHref(l)} className="text-sm font-medium transition-opacity hover:opacity-70" style={{ color: muted }}>{navLabel(l)}</a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col items-start justify-between gap-3 px-2 text-sm md:flex-row md:items-center" style={{ color: muted }}>
          <p>{content?.copyright ?? `© ${brand}. Tous droits réservés.`}</p>
          {socials.length > 0 && (
            <div className="flex gap-4">
              {socials.map((s, i) => (
                <a key={i} href={s.href || "#"} target="_blank" rel="noopener noreferrer" aria-label={s.platform ?? "lien"} className="transition-opacity hover:opacity-70" style={{ color: "var(--c-ink)" }}>
                  <SocialIcon platform={s.platform ?? "link"} className="h-5 w-5" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
