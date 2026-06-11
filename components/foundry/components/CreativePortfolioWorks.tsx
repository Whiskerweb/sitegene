// (Creative Portfolio) Grille 2×2 de projets image plein écran avec overlay gradient, hover scale + reveal au scroll.
import type { Skin } from "@/lib/foundry/types";

interface Project { title?: string; year?: string; category?: string; image?: string }

export default function CreativePortfolioWorks({ content, skin }: { content: any; skin: Skin }) {
  const title: string = typeof content.section_title === "string" ? content.section_title : "Projets";
  const items: Project[] = Array.isArray(content.items) ? content.items : [];
  const cta: string = typeof content.cta === "string" ? content.cta : "Voir tous les projets";
  const templateBase: string = typeof content._templateBase === "string" ? content._templateBase : "";

  return (
    <section className="cpworks" style={{ "--c-accent": skin.accent } as React.CSSProperties}>
      <style>{`
        .cpworks {
          padding: 100px 40px 60px;
          background: var(--c-ink, #000);
        }
        .cpworks-heading {
          font-size: clamp(48px, 8vw, 80px); font-weight: 700;
          letter-spacing: -0.03em; line-height: 1;
          color: var(--c-surface, #fff);
          font-family: var(--font-heading);
          border-top: 1px solid rgba(255,255,255,0.1);
          padding-top: 40px;
        }
        .cpworks-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 2px;
          margin-top: 48px;
        }
        .cpworks-card {
          position: relative; overflow: hidden; cursor: pointer;
          background: #111; aspect-ratio: 4/3;
        }
        .cpworks-card img {
          width: 100%; height: 100%; object-fit: cover;
          transition: transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94);
          filter: grayscale(10%);
        }
        .cpworks-card:hover img { transform: scale(1.04); filter: grayscale(0%); }
        .cpworks-info {
          position: absolute; bottom: 0; left: 0; right: 0;
          padding: 20px 24px;
          background: linear-gradient(transparent, rgba(0,0,0,0.8));
          display: flex; justify-content: space-between; align-items: flex-end;
        }
        .cpworks-card-title {
          font-size: 20px; font-weight: 700; letter-spacing: -0.02em;
          color: var(--c-surface, #fff); font-family: var(--font-heading);
        }
        .cpworks-card-year {
          font-size: 12px; letter-spacing: 0.08em; color: var(--c-muted, #b3b3b3);
          font-family: var(--font-body);
        }
        .cpworks-cta {
          margin-top: 48px; display: inline-block;
          font-size: 16px; font-weight: 700;
          color: var(--c-surface, #fff); text-decoration: none;
          border-bottom: 1px solid currentColor; padding-bottom: 2px;
          letter-spacing: 0.02em; transition: opacity 0.2s;
          font-family: var(--font-body);
        }
        .cpworks-cta:hover { opacity: 0.5; }
        @media (max-width: 768px) {
          .cpworks { padding: 64px 24px; }
          .cpworks-grid { grid-template-columns: 1fr; }
        }
      `}</style>
      <h2 className="cpworks-heading">{title}</h2>
      <div className="cpworks-grid">
        {items.map((p, i) => (
          <div key={i} className="cpworks-card">
            <a href="#" style={{ display: "block", height: "100%" }}>
              {p.image && (
                <img
                  src={templateBase ? `${templateBase}/${p.image}` : p.image}
                  alt={p.title ?? ""}
                  loading="lazy"
                />
              )}
              <div className="cpworks-info">
                <span className="cpworks-card-title">{p.title ?? ""}</span>
                <span className="cpworks-card-year">{p.year ?? ""}</span>
              </div>
            </a>
          </div>
        ))}
      </div>
      <a href="#" className="cpworks-cta">{cta}</a>
    </section>
  );
}
