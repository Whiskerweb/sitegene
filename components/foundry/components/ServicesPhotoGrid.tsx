// (Electrician Pro) Grille de services avec photo + étiquette overlay en pill.
import type { Skin } from "@/lib/foundry/types";

interface ServiceItem { title: string; image: string }

export default function ServicesPhotoGrid({ content, skin }: { content: any; skin: Skin }) {
  const label = typeof content.label === "string" ? content.label : "Services";
  const title = typeof content.title === "string" ? content.title : "Nos services";
  const items: ServiceItem[] = Array.isArray(content.items) ? content.items : [];
  return (
    <section className="spgrid" style={{ background: "var(--c-surface)" }}>
      <style>{`
        .spgrid { padding: 5rem 1.5rem; }
        .spgrid-inner { max-width: 90rem; margin: 0 auto; }
        .spgrid-eyebrow { display: inline-flex; align-items: center; gap: 0.5rem; color: var(--c-accent); font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 1rem; }
        .spgrid-dot { width: 0.375rem; height: 0.375rem; border-radius: 50%; background: var(--c-accent); }
        .spgrid-h2 { font-family: var(--font-heading); font-weight: 800; font-size: clamp(1.75rem, 4vw, 3rem); letter-spacing: -0.03em; color: var(--c-ink); max-width: 40rem; margin: 0 auto 3rem; text-align: center; }
        .spgrid-head { text-align: center; margin-bottom: 3rem; }
        .spgrid-grid { display: grid; grid-template-columns: repeat(1, 1fr); gap: 1.5rem; }
        @media(min-width: 640px) { .spgrid-grid { grid-template-columns: repeat(2, 1fr); } }
        @media(min-width: 1024px) { .spgrid-grid { grid-template-columns: repeat(3, 1fr); } }
        .spgrid-card { position: relative; border-radius: var(--r-card); overflow: hidden; }
        .spgrid-card img { width: 100%; aspect-ratio: 4/3; object-fit: cover; display: block; transition: transform .5s; }
        .spgrid-card:hover img { transform: scale(1.05); }
        .spgrid-pill { position: absolute; top: 0.75rem; left: 0.75rem; background: color-mix(in srgb, var(--c-surface) 95%, transparent); backdrop-filter: blur(4px); border-radius: var(--r-pill); padding: 0.375rem 0.5rem 0.375rem 1rem; display: flex; align-items: center; gap: 0.75rem; box-shadow: 0 2px 8px rgba(0,0,0,.08); }
        .spgrid-pill-label { color: var(--c-ink); font-weight: 600; font-size: 0.875rem; }
        .spgrid-pill-icon { width: 1.75rem; height: 1.75rem; background: var(--c-accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
      `}</style>
      <div className="spgrid-inner">
        <div className="spgrid-head">
          <p className="spgrid-eyebrow">
            <span className="spgrid-dot" />{label}
          </p>
          <h2 className="spgrid-h2">{title}</h2>
        </div>
        <div className="spgrid-grid">
          {items.map((item, i) => (
            <div key={i} className="spgrid-card">
              {item.image && <img src={item.image} alt="" />}
              <div className="spgrid-pill">
                <span className="spgrid-pill-label">{item.title}</span>
                <span className="spgrid-pill-icon">
                  <svg width="14" height="14" fill="none" stroke="var(--c-on-accent)" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M7 17 17 7M9 7h8v8" />
                  </svg>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
