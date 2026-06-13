// (Wedding Warm) Portfolio : titre centré, grille 4 travaux asymétrique (1er tall col-span-2 lignes, dernier wide).
import type { Skin } from "@/lib/foundry/types";

interface WorkItem { index: string; title: string; category: string; image: string; }

export default function WwWorksGrid({ content, skin }: { content: any; skin: Skin }) {
  const heading = typeof content.heading === "string" ? content.heading : "Travaux Choisis";
  const intro = typeof content.intro === "string" ? content.intro : "";
  const cta = typeof content.cta === "string" ? content.cta : "Voir le portfolio";
  const works: WorkItem[] = Array.isArray(content.works) ? content.works : [];
  return (
    <section id="portfolio" className="wwworks" style={{ background: "var(--c-surface)", color: "var(--c-ink)" }}>
      <style>{`
        .wwworks { padding: 6rem 3rem 9rem; }
        .wwworks__header { text-align: center; max-width: 42rem; margin: 0 auto 5rem; }
        .wwworks__heading {
          font-family: var(--font-heading); font-size: clamp(3rem, 8vw, 6rem);
          margin-bottom: 1.5rem; color: var(--c-ink);
        }
        .wwworks__intro { color: var(--c-muted); font-size: 0.875rem; line-height: 1.7; margin-bottom: 2rem; max-width: 28rem; margin-left: auto; margin-right: auto; }
        .wwworks__headerCta {
          display: inline-block; border: 1px solid color-mix(in srgb, var(--c-ink) 40%, transparent);
          font-size: 0.6875rem; letter-spacing: 0.2em; text-transform: uppercase;
          padding: 1rem 1.75rem; color: var(--c-ink); text-decoration: none;
          transition: background-color 0.4s ease, color 0.4s ease;
        }
        .wwworks__headerCta:hover { background: var(--c-panel); color: var(--c-on-panel); }
        .wwworks__grid {
          max-width: 87.5rem; margin: 0 auto;
          display: grid; grid-template-columns: 1fr;
          gap: 2rem 2rem;
        }
        @media (min-width: 768px) {
          .wwworks__grid { grid-template-columns: 1fr 1fr; }
          .wwworks__tall { grid-row: span 2; }
          .wwworks__wide { grid-column: span 2; }
        }
        .wwworks__card { display: block; text-decoration: none; color: inherit; }
        .wwworks__imgWrap { overflow: hidden; }
        .wwworks__imgTall { width: 100%; height: 380px; object-fit: cover; transition: transform 1.6s cubic-bezier(0.22,1,0.36,1); }
        @media (min-width: 768px) { .wwworks__imgTall { height: 560px; } }
        .wwworks__imgLandscape { width: 100%; height: 300px; object-fit: cover; transition: transform 1.6s cubic-bezier(0.22,1,0.36,1); }
        .wwworks__imgWide { width: 100%; height: 220px; object-fit: cover; transition: transform 1.6s cubic-bezier(0.22,1,0.36,1); }
        .wwworks__card:hover .wwworks__imgTall,
        .wwworks__card:hover .wwworks__imgLandscape,
        .wwworks__card:hover .wwworks__imgWide { transform: scale(1.05); }
        .wwworks__meta { display: flex; align-items: baseline; justify-content: space-between; margin-top: 0.75rem; }
        .wwworks__metaLeft { display: flex; align-items: baseline; gap: 0.75rem; }
        .wwworks__index { font-size: 0.625rem; letter-spacing: 0.2em; color: var(--c-muted); }
        .wwworks__cardTitle { font-family: var(--font-heading); font-size: 1.25rem; color: var(--c-ink); }
        .wwworks__category { font-size: 0.625rem; text-transform: uppercase; letter-spacing: 0.2em; color: var(--c-muted); }
        @media (max-width: 640px) { .wwworks { padding: 4rem 1.25rem 6rem; } }
      `}</style>
      <div className="wwworks__header">
        <h2 className="wwworks__heading">{heading}</h2>
        {intro && <p className="wwworks__intro">{intro}</p>}
        <a href="#contact" className="wwworks__headerCta">{cta}</a>
      </div>
      <div className="wwworks__grid">
        {works.map((w, i) => {
          const isTall = i === 0;
          const isWide = i === works.length - 1 && works.length >= 4;
          const imgClass = isWide ? "wwworks__imgWide" : isTall ? "wwworks__imgTall" : "wwworks__imgLandscape";
          return (
            <a
              key={i}
              href="#contact"
              className={`wwworks__card${isTall ? " wwworks__tall" : ""}${isWide ? " wwworks__wide" : ""}`}
            >
              <div className="wwworks__imgWrap">
                <img src={w.image} alt="" className={imgClass} />
              </div>
              <div className="wwworks__meta">
                <div className="wwworks__metaLeft">
                  <span className="wwworks__index">{w.index}</span>
                  <h3 className="wwworks__cardTitle">{w.title}</h3>
                </div>
                <span className="wwworks__category">{w.category}</span>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
