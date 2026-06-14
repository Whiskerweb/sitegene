// (Luxury Wedding) Héro plein écran : image en fond, dégradé bottom-up, titre en bas gauche + tagline bas droit.
import type { Skin } from "@/lib/foundry/types";

export default function LuxuryWeddingHero({ content, skin }: { content: any; skin: Skin }) {
  const titleLine1 = typeof content.titleLine1 === "string" ? content.titleLine1 : "Wedding";
  const titleLine2 = typeof content.titleLine2 === "string" ? content.titleLine2 : "Photography";
  const tagline = typeof content.tagline === "string" ? content.tagline : "";
  const image = typeof content.image === "string" ? content.image : "/_templates/luxury-wedding/img/hero.jpg";

  return (
    <section
      className="lwhero"
      style={{
        "--lwhero-accent": skin.accent ?? "var(--c-accent)",
        "--lwhero-surface": skin.surface ?? "var(--c-surface)",
      } as React.CSSProperties}
    >
      <style>{`
        .lwhero {
          position: relative;
          width: 100%;
          height: 100vh;
          min-height: 600px;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding-bottom: 4rem;
          background: var(--c-panel);
          overflow: hidden;
        }
        .lwhero-bg {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }
        .lwhero-bg img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          opacity: 0.8;
          filter: grayscale(100%);
        }
        .lwhero-gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0) 100%);
        }
        .lwhero-content {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 100rem;
          margin-left: auto;
          margin-right: auto;
          padding-left: 1.5rem;
          padding-right: 1.5rem;
          display: grid;
          gap: 3rem;
          align-items: flex-end;
        }
        @media (min-width: 1024px) {
          .lwhero-content {
            grid-template-columns: 1fr 1fr;
            padding-left: 3rem;
            padding-right: 3rem;
          }
        }
        .lwhero-title {
          line-height: 0.9;
          font-size: clamp(3.5rem, 10vw, 7rem);
          font-family: var(--font-heading);
          /* Posé sur le dégradé photo sombre (fixe) : reste clair sur toute charte. */
          color: rgba(255,255,255,0.95);
          font-weight: 300;
          letter-spacing: -0.04em;
          text-shadow: 0 2px 20px rgba(0,0,0,0.4);
        }
        .lwhero-tagline {
          font-family: var(--font-body);
          font-size: clamp(1.1rem, 2vw, 1.4rem);
          line-height: 1.6;
          color: rgba(255,255,255,0.85);
          font-weight: 300;
          max-width: 36rem;
          text-shadow: 0 1px 8px rgba(0,0,0,0.5);
          padding-bottom: 0.5rem;
        }
      `}</style>

      <div className="lwhero-bg">
        <img src={image} alt="" />
        <div className="lwhero-gradient" />
      </div>

      <div className="lwhero-content">
        <h1 className="lwhero-title">
          {titleLine1}<br />{titleLine2}
        </h1>
        <p className="lwhero-tagline">{tagline}</p>
      </div>
    </section>
  );
}
