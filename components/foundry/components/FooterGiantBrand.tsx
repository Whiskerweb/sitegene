// components/foundry/components/FooterGiantBrand.tsx
// Import adapté (style « Modem ») : footer centré — pastille logo (initiale),
// marque, accroche, réseaux sociaux, rangée de liens ; et surtout un TEXTE GÉANT
// de la marque en filigrane dégradé tout en bas. Dramatique et épuré.
// Liens configurables ({label,target} résolus côté public). CSS vars ; serveur.
import type { CSSProperties } from "react";
import type { Skin } from "@/lib/foundry/types";
import { navLabel, navHref } from "@/lib/foundry/nav";
import SocialIcon from "./SocialIcon";

export default function FooterGiantBrand({ content, skin }: { content: any; skin: Skin }) {
  const root: CSSProperties = {};
  if (skin.accent) root["--c-accent" as keyof CSSProperties] = skin.accent as never;
  const links: unknown[] = Array.isArray(content?.links) ? content.links : [];
  const socials: Array<{ platform?: string; href?: string }> = Array.isArray(content?.socials) ? content.socials : [];
  const brand: string = content?.brand ?? "Marque";
  const muted = "color-mix(in srgb, var(--c-ink) 55%, transparent)";

  return (
    <footer className="relative min-h-[24rem] overflow-hidden px-5 pt-16" style={{ ...root, background: "var(--c-surface)" }}>
      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center text-center">
        {/* Pastille logo (initiale de la marque) */}
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-black text-white shadow-lg" style={{ background: "linear-gradient(135deg, var(--c-ink), color-mix(in srgb, var(--c-ink) 70%, transparent))" }}>
          {brand.trim().charAt(0).toUpperCase() || "M"}
        </span>
        <span className="text-3xl font-bold" style={{ color: "var(--c-ink)", fontFamily: "var(--font-heading)" }}>{brand}</span>
        {content?.tagline && <p className="mt-2 max-w-sm text-sm font-medium" style={{ color: muted }}>{content.tagline}</p>}

        {socials.length > 0 && (
          <div className="mt-5 flex gap-4">
            {socials.map((s, i) => (
              <a key={i} href={s.href || "#"} target="_blank" rel="noopener noreferrer" aria-label={s.platform ?? "lien"} className="transition-transform hover:scale-110" style={{ color: muted }}>
                <SocialIcon platform={s.platform ?? "link"} className="h-6 w-6" />
              </a>
            ))}
          </div>
        )}

        {links.length > 0 && (
          <div className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm font-medium">
            {links.map((l, i) => (
              <a key={i} href={navHref(l)} className="transition-opacity hover:opacity-60" style={{ color: muted }}>{navLabel(l)}</a>
            ))}
          </div>
        )}

        <p className="mt-10 text-xs" style={{ color: "color-mix(in srgb, var(--c-ink) 40%, transparent)" }}>
          {content?.copyright ?? `© ${brand}. Tous droits réservés.`}
        </p>
      </div>

      {/* Texte géant de la marque en filigrane (dégradé, coupé en bas) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 select-none text-center font-extrabold leading-[0.75] tracking-tighter"
        style={{
          fontSize: "clamp(3rem, 14vw, 11rem)",
          fontFamily: "var(--font-heading)",
          color: "transparent",
          background: "linear-gradient(180deg, color-mix(in srgb, var(--c-ink) 16%, transparent) 0%, transparent 75%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          transform: "translateY(22%)",
        }}
      >
        {brand.toUpperCase()}
      </div>
    </footer>
  );
}
