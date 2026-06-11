// (Creative Portfolio) Hero plein écran fond sombre, nom géant en deux lignes (rempli + contour), tagline en muted.
import type { Skin } from "@/lib/foundry/types";

export default function CreativePortfolioHero({ content, skin }: { content: any; skin: Skin }) {
  const brand: string = typeof content.brand === "string" ? content.brand : "ALEX";
  const brandLast: string = typeof content.brand_last === "string" ? content.brand_last : "MORGAN";
  const tagline: string = typeof content.tagline === "string" ? content.tagline : "";

  return (
    <section className="cphero" style={{ "--c-accent": skin.accent } as React.CSSProperties}>
      <style>{`
        .cphero {
          min-height: 100vh;
          display: flex; flex-direction: column; justify-content: flex-end;
          padding: 0 40px 60px;
          position: relative; overflow: hidden;
          background: var(--c-ink, #000);
        }
        .cphero-name {
          font-size: clamp(100px, 18vw, 240px);
          font-weight: 700; line-height: 0.85; letter-spacing: -0.04em;
          text-transform: lowercase;
          color: var(--c-surface, #fff);
          font-family: var(--font-heading);
          position: relative; z-index: 2;
        }
        .cphero-name-stroke {
          -webkit-text-stroke: 2px currentColor;
          color: transparent;
        }
        .cphero-tagline {
          max-width: 480px; font-size: 16px; line-height: 1.6;
          color: var(--c-muted, #b3b3b3);
          margin-top: 32px; position: relative; z-index: 2;
          font-family: var(--font-body);
        }
        @media (max-width: 768px) {
          .cphero { padding: 0 24px 48px; }
        }
        @keyframes cphero-blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
      `}</style>
      <div>
        <h1 className="cphero-name" aria-label={`${brand} ${brandLast}`}>
          {brand.toLowerCase()}<br />
          <span className="cphero-name-stroke">{brandLast.toLowerCase()}</span>
        </h1>
        {tagline && <p className="cphero-tagline">{tagline}</p>}
      </div>
    </section>
  );
}
