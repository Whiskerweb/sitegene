"use client";
// components/foundry/components/StickyStackProjects.tsx
// (Agency) PILE DE PROJETS STICKY : chaque carte (image | panneau méta) est
// position:sticky avec un top croissant — au scroll, la suivante vient
// recouvrir la précédente, légèrement décalée en alternance. Derrière la pile,
// deux MOTS GÉANTS en contour évidé restent sticky. Titre de section géant
// centré au-dessus. CSS pur (aucun JS), vars sémantiques, modulable 2 à N.
import type { Skin } from "@/lib/foundry/types";

interface ProjectItem {
  name: string;
  image: string;
  year?: string;
  category?: string;
  cta?: string;
  href?: string;
}

export default function StickyStackProjects({ content, skin }: { content: any; skin: Skin }) {
  const items: ProjectItem[] = Array.isArray(content?.items) ? content.items : [];

  return (
    <section
      className="ssproj"
      style={{ "--c-accent": skin?.accent } as React.CSSProperties}
    >
      <style>{`
        .ssproj {
          position: relative; overflow: visible;
          background: var(--c-panel); color: var(--c-on-panel);
          padding: 80px 0 100px;
        }
        .ssproj-title {
          margin: 0 auto 56px; padding: 0 20px; text-align: center;
          font-family: var(--font-heading); text-transform: uppercase;
          font-size: clamp(42px, 7vw, 96px); line-height: .95; letter-spacing: .01em;
        }
        .ssproj-bg {
          position: sticky; top: 40vh; height: 0; z-index: 0;
          pointer-events: none; display: none;
        }
        @media (min-width: 1024px) { .ssproj-bg { display: block; } }
        .ssproj-bg-in {
          max-width: 1500px; margin: 0 auto; padding: 0 16px;
          display: flex; justify-content: space-between;
        }
        .ssproj-bg-word {
          font-family: var(--font-heading); text-transform: uppercase;
          font-size: 7vw; line-height: 1; color: transparent;
          -webkit-text-stroke: 1px color-mix(in srgb, var(--c-on-panel) 22%, transparent);
        }
        .ssproj-stack { position: relative; z-index: 1; max-width: 960px; margin: 0 auto; padding: 0 20px; }
        .ssproj-card-slot { position: sticky; }
        .ssproj-card {
          display: grid; grid-template-columns: 1fr;
          border: 1px solid color-mix(in srgb, var(--c-on-panel) 14%, transparent);
          background: color-mix(in srgb, var(--c-on-panel) 5%, var(--c-panel));
          box-shadow: 0 30px 80px -30px color-mix(in srgb, var(--c-panel) 85%, transparent);
          overflow: hidden;
        }
        @media (min-width: 768px) { .ssproj-card { grid-template-columns: 1fr 1fr; } }
        .ssproj-img { position: relative; aspect-ratio: 4/3; }
        @media (min-width: 768px) { .ssproj-img { aspect-ratio: auto; min-height: 320px; } }
        .ssproj-img img {
          position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: cover; transition: transform .7s ease;
        }
        .ssproj-card:hover .ssproj-img img { transform: scale(1.05); }
        .ssproj-info { display: flex; flex-direction: column; justify-content: space-between; gap: 36px; padding: 26px; }
        .ssproj-name {
          margin: 0; padding-bottom: 16px;
          border-bottom: 1px solid color-mix(in srgb, var(--c-on-panel) 14%, transparent);
          font-family: var(--font-heading); text-transform: uppercase;
          font-size: clamp(22px, 2.6vw, 32px); line-height: 1.05;
        }
        .ssproj-row {
          display: flex; justify-content: space-between; gap: 12px;
          padding: 10px 0; margin: 0;
          border-bottom: 1px solid color-mix(in srgb, var(--c-on-panel) 14%, transparent);
          font-family: var(--font-label, var(--font-body)); font-size: 11px;
          letter-spacing: .14em; text-transform: uppercase;
          color: color-mix(in srgb, var(--c-on-panel) 60%, transparent);
        }
        .ssproj-row b { font-weight: 500; color: var(--c-on-panel); }
        .ssproj-btn {
          display: inline-flex; align-items: center; gap: 8px; margin-top: 22px;
          padding: 11px 20px; width: fit-content;
          border: 1px solid color-mix(in srgb, var(--c-on-panel) 20%, transparent);
          font-family: var(--font-label, var(--font-body)); font-size: 11px;
          letter-spacing: .12em; text-transform: uppercase;
          color: var(--c-on-panel); text-decoration: none;
          transition: background .3s ease, color .3s ease, border-color .3s ease;
        }
        .ssproj-btn:hover { background: var(--c-accent); border-color: var(--c-accent); color: var(--c-on-accent, var(--c-ink)); }
      `}</style>

      {content?.title && <h2 className="ssproj-title">{content.title}</h2>}

      {(content?.bgWordLeft || content?.bgWordRight) && (
        <div className="ssproj-bg" aria-hidden>
          <div className="ssproj-bg-in">
            <span className="ssproj-bg-word">{content?.bgWordLeft ?? ""}</span>
            <span className="ssproj-bg-word">{content?.bgWordRight ?? ""}</span>
          </div>
        </div>
      )}

      <div className="ssproj-stack">
        {items.map((item, i) => (
          <div
            key={i}
            className="ssproj-card-slot"
            style={{ top: `${96 + i * 36}px`, marginTop: i === 0 ? 0 : 80 }}
          >
            <article
              className="ssproj-card"
              style={{ transform: `translateX(${(i % 2 === 0 ? -1 : 1) * 12}px)` }}
            >
              <div className="ssproj-img">
                <img src={item.image} alt={item.name} loading="lazy" />
              </div>
              <div className="ssproj-info">
                <h3 className="ssproj-name">{item.name}</h3>
                <div>
                  {item.year && (
                    <p className="ssproj-row"><span>Année :</span> <b>{item.year}</b></p>
                  )}
                  {item.category && (
                    <p className="ssproj-row"><span>Catégorie :</span> <b>{item.category}</b></p>
                  )}
                  <a className="ssproj-btn" href={item.href || "#contact"}>
                    {item.cta || "Voir le projet"} →
                  </a>
                </div>
              </div>
            </article>
          </div>
        ))}
      </div>
    </section>
  );
}
