// (Wedding Warm) Hero plein écran : image parallax, dégradé du bas, titre serif massif, tagline + CTA bas de page.
import type { Skin } from "@/lib/foundry/types";

export default function WwHeroFullscreen({ content, skin }: { content: any; skin: Skin }) {
  const title1 = typeof content.title1 === "string" ? content.title1 : "Capturer Vos";
  const title2 = typeof content.title2 === "string" ? content.title2 : "Instants Précieux";
  const tagline = typeof content.tagline === "string" ? content.tagline : "";
  const cta = typeof content.cta === "string" ? content.cta : "Voir les services";
  const image = typeof content.image === "string" ? content.image : "";
  return (
    <header id="home" className="wwherofs">
      <style>{`
        .wwherofs {
          position: relative; width: 100%; height: 100vh; min-height: 640px;
          overflow: hidden; background: var(--c-ink);
        }
        .wwherofs__img {
          position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: cover;
        }
        .wwherofs__overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.25) 45%, rgba(0,0,0,0.30) 100%);
        }
        .wwherofs__content {
          position: relative; z-index: 10; height: 100%;
          display: flex; flex-direction: column; justify-content: center;
          padding: 0 3rem;
          max-width: 1400px;
        }
        .wwherofs__title {
          font-family: var(--font-heading); color: #fff;
          line-height: 0.95; font-size: clamp(3rem, 9vw, 7rem);
        }
        .wwherofs__bottom {
          position: absolute; bottom: 2.5rem; left: 3rem; right: 3rem;
          z-index: 10; display: flex; flex-direction: column; gap: 1.5rem;
        }
        @media (min-width: 768px) {
          .wwherofs__bottom { flex-direction: row; align-items: flex-end; justify-content: space-between; }
        }
        .wwherofs__tagline {
          color: rgba(255,255,255,0.9); font-size: 0.875rem;
          max-width: 18rem; line-height: 1.6;
        }
        .wwherofs__cta {
          display: inline-block; border: 1px solid rgba(255,255,255,0.6);
          color: #fff; font-size: 0.6875rem; letter-spacing: 0.2em;
          text-transform: uppercase; padding: 1rem 1.75rem;
          text-decoration: none;
          transition: background-color 0.4s ease, color 0.4s ease;
        }
        .wwherofs__cta:hover { background: #fff; color: var(--c-ink); }
        @media (max-width: 640px) { .wwherofs__content, .wwherofs__bottom { padding-left: 1.25rem; padding-right: 1.25rem; } }
      `}</style>
      {image && <img src={image} alt="" className="wwherofs__img" />}
      <div className="wwherofs__overlay" />
      <div className="wwherofs__content">
        <h1 className="wwherofs__title">
          <span style={{ display: "block" }}>{title1}</span>
          <span style={{ display: "block" }}>{title2}</span>
        </h1>
      </div>
      <div className="wwherofs__bottom">
        <p className="wwherofs__tagline">{tagline}</p>
        <a href="#services" className="wwherofs__cta">{cta}</a>
      </div>
    </header>
  );
}
