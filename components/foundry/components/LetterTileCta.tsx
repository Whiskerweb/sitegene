"use client";
// components/foundry/components/LetterTileCta.tsx
// (Agency) CTA FINAL à VIGNETTE-LETTRE : phrase géante en capitales condensées
// sur photo voilée sombre ; dans la ligne marquée d'un « * », la lettre est
// remplacée par une petite IMAGE carrée insérée dans la typo (signature
// graphique). Bouton plein qui passe à l'accent au survol. CSS pur.
import type { Skin } from "@/lib/foundry/types";

export default function LetterTileCta({ content, skin }: { content: any; skin: Skin }) {
  const lines: string[] = Array.isArray(content?.lines) ? content.lines.map(String) : [];
  const href: string = typeof content?.ctaHref === "string" && content.ctaHref ? content.ctaHref : "#contact";

  return (
    <section
      className="ltcta"
      style={{ "--c-accent": skin?.accent } as React.CSSProperties}
    >
      <style>{`
        .ltcta {
          position: relative; overflow: hidden;
          background: var(--c-panel); color: var(--c-on-panel);
          padding: 110px 28px;
        }
        .ltcta-bg {
          position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: cover; opacity: .42;
        }
        .ltcta-veil {
          position: absolute; inset: 0;
          background: linear-gradient(90deg,
            var(--c-panel) 0%,
            color-mix(in srgb, var(--c-panel) 70%, transparent) 55%,
            color-mix(in srgb, var(--c-panel) 35%, transparent) 100%);
        }
        .ltcta-in { position: relative; max-width: 1240px; margin: 0 auto; }
        .ltcta-title {
          margin: 0; font-family: var(--font-heading);
          font-size: clamp(42px, 7.5vw, 118px);
          line-height: .95; letter-spacing: .01em; text-transform: uppercase;
        }
        .ltcta-line { display: block; }
        .ltcta-tile-line { display: flex; align-items: center; gap: .06em; }
        .ltcta-tile {
          display: inline-block; height: .72em; aspect-ratio: 1;
          overflow: hidden; align-self: center;
        }
        .ltcta-tile img { width: 100%; height: 100%; object-fit: cover; }
        .ltcta-btn {
          display: inline-flex; align-items: center; gap: 10px; margin-top: 44px;
          padding: 16px 32px;
          background: var(--c-on-panel); color: var(--c-panel);
          font-family: var(--font-label, var(--font-body)); font-size: 13px;
          letter-spacing: .12em; text-transform: uppercase; text-decoration: none;
          transition: background .3s ease, color .3s ease;
        }
        .ltcta-btn:hover { background: var(--c-accent); color: var(--c-on-accent, var(--c-ink)); }
      `}</style>

      {content?.image && <img className="ltcta-bg" src={content.image} alt="" loading="lazy" />}
      <div className="ltcta-veil" aria-hidden />

      <div className="ltcta-in">
        <p className="ltcta-title">
          {lines.map((line, i) => {
            const star = line.indexOf("*");
            if (star !== -1 && content?.tile) {
              const before = line.slice(0, star);
              const after = line.slice(star + 1);
              return (
                <span key={i} className="ltcta-tile-line">
                  {before}
                  <span className="ltcta-tile">
                    <img src={content.tile} alt="" loading="lazy" />
                  </span>
                  {after}
                </span>
              );
            }
            return (
              <span key={i} className="ltcta-line">
                {line.replace("*", "O")}
              </span>
            );
          })}
        </p>
        {content?.cta && (
          <a className="ltcta-btn" href={href}>
            {content.cta} →
          </a>
        )}
      </div>
    </section>
  );
}
