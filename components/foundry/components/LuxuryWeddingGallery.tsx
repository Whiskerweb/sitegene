// (Luxury Wedding) Galerie portfolio en grille 4 colonnes avec cellules featured (blur+sharp superposés, span ×2) et cellules texte intercalées.
import type { Skin } from "@/lib/foundry/types";

interface GalleryItem {
  image?: string;
  imageBlur?: string;
  imageSharp?: string;
  alt?: string;
}
interface Caption { title?: string; body?: string }

export default function LuxuryWeddingGallery({ content, skin }: { content: any; skin: Skin }) {
  const heading1 = typeof content.heading1 === "string" ? content.heading1 : "Selected work";
  const subheading = typeof content.subheading === "string" ? content.subheading : "Moments that are returned to";
  const intro = typeof content.intro === "string" ? content.intro : "";
  const caption1: Caption = content.caption1 && typeof content.caption1 === "object" ? content.caption1 : { title: "Quiet beauty", body: "" };
  const caption2: Caption = content.caption2 && typeof content.caption2 === "object" ? content.caption2 : { title: "Natural harmony", body: "" };
  const gallery: GalleryItem[] = Array.isArray(content.gallery) ? content.gallery : [];

  const fallback = "/_templates/luxury-wedding/img/gallery-rings.jpg";
  const g = (i: number) => gallery[i] ?? {};

  return (
    <section className="lwgal" style={{ background: "var(--c-panel)" }}>
      <style>{`
        .lwgal {
          padding: 6rem 0;
          overflow: hidden;
          color: var(--c-on-panel);
        }
        .lwgal-inner {
          max-width: 100rem;
          margin: 0 auto;
          padding: 0 1rem;
        }
        @media (min-width: 640px) { .lwgal-inner { padding: 0 1.5rem; } }
        @media (min-width: 1024px) { .lwgal-inner { padding: 0 2rem; } }
        .lwgal-header {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          margin-bottom: 4rem;
        }
        @media (min-width: 1024px) {
          .lwgal-header {
            flex-direction: row;
            align-items: flex-end;
            justify-content: space-between;
          }
        }
        .lwgal-h1 {
          font-size: clamp(3rem, 8vw, 6.5rem);
          font-family: var(--font-heading);
          font-weight: 300;
          letter-spacing: -0.04em;
          line-height: 0.95;
          color: var(--c-on-panel);
        }
        .lwgal-h1 em { font-style: italic; }
        .lwgal-subh {
          font-size: clamp(3rem, 8vw, 6.5rem);
          font-family: var(--font-heading);
          font-weight: 300;
          letter-spacing: -0.04em;
          line-height: 0.95;
          color: var(--c-on-panel);
        }
        .lwgal-intro {
          font-family: var(--font-body);
          font-size: 1.1rem;
          line-height: 1.7;
          color: color-mix(in srgb, var(--c-on-panel) 55%, transparent);
          font-weight: 300;
          max-width: 28rem;
          padding-bottom: 0.25rem;
        }
        .lwgal-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2px;
          background: var(--c-panel);
        }
        @media (min-width: 1024px) { .lwgal-grid { grid-template-columns: repeat(4, 1fr); } }
        .lwgal-cell {
          aspect-ratio: 1 / 1;
          background: var(--c-card);
          overflow: hidden;
          position: relative;
        }
        .lwgal-cell img {
          width: 100%; height: 100%;
          object-fit: cover;
          transition: transform 1.5s ease-out;
        }
        .lwgal-cell:hover img { transform: scale(1.05); }
        .lwgal-featured {
          grid-column: span 2;
          grid-row: span 2;
          position: relative;
          overflow: hidden;
          background: var(--c-card);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .lwgal-featured-bg {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          object-fit: cover;
          filter: blur(4px);
          opacity: 0.4;
          transition: transform 2s ease-out;
        }
        .lwgal-featured:hover .lwgal-featured-bg { transform: scale(1.06); }
        .lwgal-featured-sharp-wrap {
          position: relative; z-index: 10;
          width: 60%; aspect-ratio: 1/1;
          overflow: hidden;
          box-shadow: 0 24px 80px -20px rgba(0,0,0,0.85);
          border: 1px solid color-mix(in srgb, var(--c-on-panel) 5%, transparent);
        }
        .lwgal-featured-sharp {
          width: 100%; height: 100%;
          object-fit: cover;
          transition: transform 2s ease-out;
        }
        .lwgal-featured:hover .lwgal-featured-sharp { transform: scale(1.1); }
        .lwgal-caption {
          aspect-ratio: 1 / 1;
          background: var(--c-panel);
          border: 1px solid color-mix(in srgb, var(--c-on-panel) 5%, transparent);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        @media (min-width: 1024px) { .lwgal-caption { padding: 2rem; } }
        .lwgal-cap-title {
          font-family: var(--font-heading);
          font-size: clamp(1.8rem, 4vw, 3rem);
          letter-spacing: -0.03em;
          color: var(--c-on-panel);
          font-weight: 300;
          line-height: 1;
        }
        .lwgal-cap-title em { font-style: italic; font-weight: 200; }
        .lwgal-cap-body {
          font-family: var(--font-body);
          font-size: 0.875rem;
          color: color-mix(in srgb, var(--c-on-panel) 50%, transparent);
          font-weight: 200;
          line-height: 1.6;
          max-width: 200px;
        }
      `}</style>

      <div className="lwgal-inner">
        <div className="lwgal-header">
          <div>
            <div style={{ borderBottom: "1px solid color-mix(in srgb, var(--c-on-panel) 10%, transparent)", marginBottom: "2.5rem", paddingBottom: "0" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.5rem" }}>
                <p style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "color-mix(in srgb, var(--c-on-panel) 50%, transparent)", fontFamily: "var(--font-body)", fontWeight: 300 }}>{heading1}</p>
              </div>
            </div>
            <h2 className="lwgal-subh">{subheading}</h2>
          </div>
          <p className="lwgal-intro">{intro}</p>
        </div>

        <div className="lwgal-grid">
          {/* Cell 1 */}
          <div className="lwgal-cell">
            <img src={(g(0) as any).image ?? fallback} alt={(g(0) as any).alt ?? ""} />
          </div>
          {/* Cell 2 */}
          <div className="lwgal-cell">
            <img src={(g(1) as any).image ?? "/_templates/luxury-wedding/img/gallery-bouquet.jpg"} alt={(g(1) as any).alt ?? ""} />
          </div>
          {/* Featured 1 — col+row span 2 */}
          <div className="lwgal-featured">
            <img className="lwgal-featured-bg" src={(g(2) as any).imageBlur ?? "/_templates/luxury-wedding/img/gallery-bride-blur.jpg"} alt="" />
            <div className="lwgal-featured-sharp-wrap">
              <img className="lwgal-featured-sharp" src={(g(2) as any).imageSharp ?? "/_templates/luxury-wedding/img/gallery-bride-sharp.jpg"} alt={(g(2) as any).alt ?? ""} />
            </div>
          </div>
          {/* Cell 4 */}
          <div className="lwgal-cell">
            <img src={(g(3) as any).image ?? "/_templates/luxury-wedding/img/gallery-table.jpg"} alt={(g(3) as any).alt ?? ""} />
          </div>
          {/* Caption 1 */}
          <div className="lwgal-caption">
            <h3 className="lwgal-cap-title"><em>Quiet</em> {caption1.title}</h3>
            <p className="lwgal-cap-body">{caption1.body}</p>
          </div>
          {/* Featured 2 */}
          <div className="lwgal-featured">
            <img className="lwgal-featured-bg" src={(g(4) as any).imageBlur ?? "/_templates/luxury-wedding/img/gallery-couple-blur.jpg"} alt="" />
            <div className="lwgal-featured-sharp-wrap">
              <img className="lwgal-featured-sharp" src={(g(4) as any).imageSharp ?? "/_templates/luxury-wedding/img/gallery-couple-sharp.jpg"} alt={(g(4) as any).alt ?? ""} />
            </div>
          </div>
          {/* Cell 7 */}
          <div className="lwgal-cell">
            <img src={(g(5) as any).image ?? "/_templates/luxury-wedding/img/gallery-dancing.jpg"} alt={(g(5) as any).alt ?? ""} style={{ filter: "grayscale(100%)" }} />
          </div>
          {/* Cell 8 */}
          <div className="lwgal-cell">
            <img src={(g(6) as any).image ?? "/_templates/luxury-wedding/img/gallery-champagne.jpg"} alt={(g(6) as any).alt ?? ""} />
          </div>
          {/* Caption 2 */}
          <div className="lwgal-caption">
            <h3 className="lwgal-cap-title"><em>Natural</em> {caption2.title}</h3>
            <p className="lwgal-cap-body">{caption2.body}</p>
          </div>
          {/* Cell 10 */}
          <div className="lwgal-cell">
            <img src={(g(7) as any).image ?? "/_templates/luxury-wedding/img/gallery-dress.jpg"} alt={(g(7) as any).alt ?? ""} />
          </div>
        </div>
      </div>
    </section>
  );
}
