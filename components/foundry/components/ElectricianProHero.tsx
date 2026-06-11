// (Electrician Pro) Hero centré avec image pleine largeur, rating pill et badge.
import type { Skin } from "@/lib/foundry/types";

export default function ElectricianProHero({ content, skin }: { content: any; skin: Skin }) {
  const title = typeof content.title === "string" ? content.title : "Solutions électriques fiables";
  const tagline = typeof content.tagline === "string" ? content.tagline : "";
  const cta = typeof content.cta === "string" ? content.cta : "Réserver";
  const rating = typeof content.rating === "string" ? content.rating : "4.8+";
  const badge = typeof content.badge === "string" ? content.badge : "";
  const image = typeof content.image === "string" ? content.image : "";
  return (
    <section className="ephero relative" style={{ background: "var(--c-surface)" }}>
      <style>{`
        .ephero { overflow: hidden; }
        .ephero-inner { max-width: 80rem; margin: 0 auto; padding: 4rem 1.5rem 2.5rem; text-align: center; }
        .ephero-rating { display: inline-flex; align-items: center; gap: 0.5rem; margin-bottom: 1.75rem; }
        .ephero-stars { font-size: 0.875rem; color: var(--c-accent); }
        .ephero-ratingtext { font-size: 0.875rem; font-weight: 500; color: var(--c-muted); }
        .ephero-h1 { font-family: var(--font-heading); font-weight: 800; font-size: clamp(2.5rem, 6vw, 4.5rem); line-height: 1.05; letter-spacing: -0.03em; color: var(--c-ink); max-width: 44rem; margin: 0 auto 1.5rem; }
        .ephero-tagline { font-size: 1rem; color: var(--c-muted); max-width: 32rem; margin: 0 auto 2rem; line-height: 1.6; }
        .ephero-cta { display: inline-flex; align-items: center; gap: 0.5rem; background: var(--c-accent); color: #fff; font-weight: 600; font-size: 0.875rem; padding: 0.875rem 1.75rem; border-radius: var(--r-pill); text-decoration: none; transition: filter .2s; }
        .ephero-cta:hover { filter: brightness(.95); }
        .ephero-imgwrap { max-width: 80rem; margin: 0 auto; padding: 0 1.5rem 4rem; position: relative; }
        .ephero-img { width: 100%; height: clamp(260px, 40vw, 520px); object-fit: cover; border-radius: var(--r-xl); display: block; }
        .ephero-badge { position: absolute; bottom: 5.5rem; right: 3rem; background: var(--c-surface); color: var(--c-ink); font-size: 0.75rem; font-weight: 600; padding: 0.5rem 1rem; border-radius: var(--r-pill); box-shadow: 0 2px 12px rgba(0,0,0,.1); display: flex; align-items: center; gap: 0.5rem; }
        .ephero-dot { width: 0.5rem; height: 0.5rem; border-radius: 50%; background: var(--c-accent); }
      `}</style>
      <div className="ephero-inner">
        <div className="ephero-rating">
          <span className="ephero-stars">★★★★★</span>
          <span className="ephero-ratingtext">{rating} Avis vérifiés</span>
        </div>
        <h1 className="ephero-h1">{title}</h1>
        <p className="ephero-tagline">{tagline}</p>
        <a href="#services" className="ephero-cta">{cta}</a>
      </div>
      {image && (
        <div className="ephero-imgwrap">
          <img src={image} alt="" className="ephero-img" />
          {badge && (
            <div className="ephero-badge">
              <span className="ephero-dot" />
              {badge}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
