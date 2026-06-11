// (Luxury Wedding) Services en lignes séparées par bordures avec révélation d'image au hover (desktop) et décalage latéral des titres.
import type { Skin } from "@/lib/foundry/types";

interface ServiceItem { title: string; desc: string; category: string; image: string }

export default function LuxuryWeddingServices({ content, skin }: { content: any; skin: Skin }) {
  const label = typeof content.label === "string" ? content.label : "Services";
  const intro = typeof content.intro === "string" ? content.intro : "";
  const items: ServiceItem[] = Array.isArray(content.items) ? content.items : [
    { title: "Photographie éditoriale", desc: "", category: "Photography", image: "/_templates/luxury-wedding/img/service-photography.jpg" },
    { title: "Films cinématographiques", desc: "", category: "Videography", image: "/_templates/luxury-wedding/img/service-videography.jpg" },
    { title: "Diffusion en direct", desc: "", category: "Broadcasting", image: "/_templates/luxury-wedding/img/service-broadcasting.jpg" },
  ];

  return (
    <section className="lwsvc" style={{ background: skin.surface ?? "var(--c-surface)" }}>
      <style>{`
        .lwsvc {
          padding: 6rem 0;
          overflow: hidden;
        }
        .lwsvc-inner {
          max-width: 100rem;
          margin: 0 auto;
          padding: 0 1.5rem;
        }
        @media (min-width: 1024px) { .lwsvc-inner { padding: 0 3rem; } }
        .lwsvc-header {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          margin-bottom: 4rem;
          align-items: flex-start;
          justify-content: space-between;
        }
        @media (min-width: 768px) {
          .lwsvc-header {
            flex-direction: row;
            align-items: flex-end;
          }
        }
        .lwsvc-htitle {
          font-size: clamp(2.5rem, 6vw, 4.5rem);
          font-family: var(--font-heading);
          font-weight: 300;
          letter-spacing: -0.04em;
          color: var(--c-ink);
          line-height: 1.1;
        }
        .lwsvc-hint {
          max-width: 28rem;
          font-family: var(--font-body);
          font-size: 1rem;
          line-height: 1.7;
          color: color-mix(in srgb, var(--c-ink) 55%, transparent);
          font-weight: 200;
        }
        .lwsvc-row {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          padding: 2rem 0;
          border-top: 1px solid color-mix(in srgb, var(--c-ink) 15%, transparent);
          cursor: pointer;
        }
        .lwsvc-row:last-child { border-bottom: 1px solid color-mix(in srgb, var(--c-ink) 15%, transparent); }
        @media (min-width: 1024px) {
          .lwsvc-row {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }
        .lwsvc-preview {
          display: none;
          position: absolute;
          top: 50%;
          left: 60%;
          transform: translate(-50%, -50%) scale(0.75);
          opacity: 0;
          pointer-events: none;
          z-index: 20;
          transition: opacity 0.7s cubic-bezier(0.76,0,0.24,1), transform 0.7s cubic-bezier(0.76,0,0.24,1);
        }
        @media (min-width: 1024px) { .lwsvc-preview { display: block; } }
        .lwsvc-row:hover .lwsvc-preview {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }
        .lwsvc-preview-img {
          width: 450px; height: 320px;
          border-radius: var(--r-card);
          overflow: hidden;
          box-shadow: 0 24px 80px -20px rgba(0,0,0,0.35);
          background: #18181b;
        }
        .lwsvc-preview-img img { width: 100%; height: 100%; object-fit: cover; }
        .lwsvc-body {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          z-index: 10;
          position: relative;
          width: 100%;
          align-items: flex-start;
          justify-content: space-between;
        }
        @media (min-width: 1024px) {
          .lwsvc-body {
            flex-direction: row;
            align-items: center;
          }
        }
        .lwsvc-row:hover .lwsvc-body { opacity: 0.4; }
        .lwsvc-body { transition: opacity 0.3s ease; }
        .lwsvc-name {
          font-size: clamp(1.6rem, 3.5vw, 2.5rem);
          font-family: var(--font-heading);
          font-weight: 300;
          letter-spacing: -0.03em;
          color: var(--c-ink);
          transition: transform 0.5s ease;
        }
        .lwsvc-row:hover .lwsvc-name { transform: translateX(1rem); }
        .lwsvc-desc {
          font-family: var(--font-body);
          font-size: 1rem;
          line-height: 1.7;
          color: color-mix(in srgb, var(--c-ink) 65%, transparent);
          font-weight: 200;
          max-width: 28rem;
          transition: transform 0.5s ease;
        }
        @media (min-width: 1024px) { .lwsvc-desc { width: 33%; } }
        .lwsvc-row:hover .lwsvc-desc { transform: translateX(0.5rem); }
        .lwsvc-cat {
          font-family: var(--font-body);
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: color-mix(in srgb, var(--c-ink) 55%, transparent);
          transition: transform 0.5s ease;
        }
        .lwsvc-row:hover .lwsvc-cat { transform: translateX(-1rem); }
        /* Mobile image */
        .lwsvc-mobile-img {
          display: block;
          width: 100%;
          margin-top: 1.5rem;
          border-radius: var(--r-card);
          overflow: hidden;
          box-shadow: 0 8px 32px -10px rgba(0,0,0,0.15);
          position: relative;
        }
        .lwsvc-mobile-img img { width: 100%; height: 16rem; object-fit: cover; display: block; }
        @media (min-width: 1024px) { .lwsvc-mobile-img { display: none; } }
      `}</style>

      <div className="lwsvc-inner">
        <div className="lwsvc-header">
          <h2 className="lwsvc-htitle">{label}</h2>
          <p className="lwsvc-hint">{intro}</p>
        </div>

        {items.map((item, i) => (
          <div key={i} className="lwsvc-row">
            {/* Hover preview desktop */}
            <div className="lwsvc-preview">
              <div className="lwsvc-preview-img">
                <img src={item.image} alt={item.title} />
              </div>
            </div>
            {/* Content */}
            <div className="lwsvc-body">
              <h3 className="lwsvc-name" style={{ width: "33%" }}>{item.title}</h3>
              <p className="lwsvc-desc">{item.desc}</p>
              <span className="lwsvc-cat">{item.category}</span>
            </div>
            {/* Mobile image */}
            <div className="lwsvc-mobile-img">
              <img src={item.image} alt={item.title} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
