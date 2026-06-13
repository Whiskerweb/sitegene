"use client";
// components/foundry/components/BoldTypeHero.tsx
// (Agency) Hero typographique XXL : trois lignes en capitales condensées
// alignées à droite, révélées par remontée masquée ; une VIGNETTE « showreel »
// (image + libellé play + durée) s'insère DANS le bloc typo entre les lignes
// 2 et 3. Barre méta au-dessus : baseline à gauche, étoiles accent au centre,
// promesse à droite. Fond encre (panneau sombre quel que soit le mode), CSS
// vars uniquement, animations CSS pures.
import type { Skin } from "@/lib/foundry/types";

export default function BoldTypeHero({ content, skin }: { content: any; skin: Skin }) {
  const lines: string[] = Array.isArray(content?.titleLines)
    ? content.titleLines.map(String)
    : ["VOTRE", "MARQUE", "ICI"];
  const [l1, l2, l3] = [lines[0] ?? "", lines[1] ?? "", lines[2] ?? ""];
  const stars = Math.max(0, Math.min(5, Number(content?.stars ?? 5)));
  const href: string = typeof content?.ctaHref === "string" && content.ctaHref ? content.ctaHref : "#contact";

  return (
    <section
      className="bthero"
      style={{ "--c-accent": skin?.accent } as React.CSSProperties}
    >
      <style>{`
        .bthero {
          position: relative; overflow: hidden;
          background: var(--c-panel); color: var(--c-on-panel);
          padding: 96px 28px 64px;
        }
        .bthero-in { max-width: 1240px; margin: 0 auto; }
        .bthero-meta {
          display: flex; align-items: flex-start; justify-content: space-between; gap: 20px;
          border-bottom: 1px solid color-mix(in srgb, var(--c-on-panel) 16%, transparent);
          padding-bottom: 18px; margin-bottom: 30px;
          font-family: var(--font-label, var(--font-body)); font-size: 11px;
          letter-spacing: .14em; text-transform: uppercase;
          color: color-mix(in srgb, var(--c-on-panel) 62%, transparent);
        }
        .bthero-meta p { max-width: 200px; margin: 0; }
        .bthero-meta p:last-child { text-align: right; }
        .bthero-stars { display: flex; gap: 3px; flex-shrink: 0; }
        .bthero-star { width: 11px; height: 11px; fill: var(--c-accent); }
        .bthero-title {
          margin: 0; text-align: right;
          font-family: var(--font-heading);
          font-size: clamp(54px, 9vw, 140px);
          line-height: .92; letter-spacing: .01em; text-transform: uppercase;
          color: var(--c-on-panel);
        }
        .bthero-line { display: block; overflow: hidden; }
        .bthero-line > span {
          display: block; transform: translateY(110%);
          animation: bthero-rise .85s cubic-bezier(.21,.65,.36,1) forwards;
        }
        .bthero-line:nth-child(1) > span { animation-delay: .08s; }
        .bthero-line:nth-child(2) > span { animation-delay: .2s; }
        .bthero-line:nth-child(4) > span { animation-delay: .32s; }
        @keyframes bthero-rise { to { transform: translateY(0); } }
        .bthero-reel {
          position: relative; display: block; width: 100%;
          aspect-ratio: 16 / 5.5; margin: .12em 0; overflow: hidden;
          opacity: 0; animation: bthero-fade .7s ease .5s forwards;
        }
        @keyframes bthero-fade { to { opacity: 1; } }
        .bthero-reel img {
          position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: cover; transition: transform .7s ease;
        }
        .bthero-reel:hover img { transform: scale(1.05); }
        .bthero-reel::after {
          content: ""; position: absolute; inset: 0;
          background: color-mix(in srgb, var(--c-panel) 28%, transparent);
          transition: background .3s ease;
        }
        .bthero-reel:hover::after { background: color-mix(in srgb, var(--c-panel) 10%, transparent); }
        .bthero-reel-label, .bthero-reel-time {
          position: absolute; bottom: 12px; z-index: 1;
          font-family: var(--font-label, var(--font-body)); font-size: 11px;
          letter-spacing: .14em; text-transform: uppercase; color: var(--c-on-panel);
          display: flex; align-items: center; gap: 7px;
        }
        .bthero-reel-label { left: 16px; }
        .bthero-reel-time { right: 16px; opacity: .8; }
        .bthero-play { width: 12px; height: 12px; fill: var(--c-on-panel); }
        @media (max-width: 640px) {
          .bthero { padding: 80px 18px 48px; }
          .bthero-meta { flex-wrap: wrap; }
        }
      `}</style>
      <div className="bthero-in">
        <div className="bthero-meta">
          {content?.metaLeft ? <p>{content.metaLeft}</p> : <span />}
          {stars > 0 && (
            <span className="bthero-stars" aria-label={`${stars} étoiles`}>
              {Array.from({ length: stars }).map((_, i) => (
                <svg key={i} className="bthero-star" viewBox="0 0 24 24" aria-hidden>
                  <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" />
                </svg>
              ))}
            </span>
          )}
          {content?.metaRight ? <p>{content.metaRight}</p> : <span />}
        </div>

        <h1 className="bthero-title">
          <span className="bthero-line"><span>{l1}</span></span>
          <span className="bthero-line"><span>{l2}</span></span>
          {content?.showreelImage && (
            <a className="bthero-reel" href={href} aria-label={content?.playLabel || "Voir le showreel"}>
              <img src={content.showreelImage} alt="" loading="lazy" />
              <span className="bthero-reel-label">
                <svg className="bthero-play" viewBox="0 0 24 24" aria-hidden>
                  <path d="M8 5v14l11-7z" />
                </svg>
                {content?.playLabel || "Voir le showreel"}
              </span>
              {content?.duration && <span className="bthero-reel-time">{content.duration}</span>}
            </a>
          )}
          <span className="bthero-line"><span>{l3}</span></span>
        </h1>
      </div>
    </section>
  );
}
