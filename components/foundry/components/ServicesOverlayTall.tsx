// (Multi-Trade) Grille de services hautes cartes image avec overlay gradient et description.
import type { Skin } from "@/lib/foundry/types";

interface ServiceItem { title: string; desc: string; image: string }

export default function ServicesOverlayTall({ content, skin }: { content: any; skin: Skin }) {
  const label = typeof content.label === "string" ? content.label : "Services";
  const title = typeof content.title === "string" ? content.title : "Nos expertises";
  const subtitle = typeof content.subtitle === "string" ? content.subtitle : "";
  const items: ServiceItem[] = Array.isArray(content.items) ? content.items : [];
  return (
    <section className="sovtall" style={{ background: "var(--c-surface)" }}>
      <style>{`
        .sovtall { padding: 6rem 1.5rem; }
        .sovtall-inner { max-width: 90rem; margin: 0 auto; }
        .sovtall-head { display: grid; gap: 2rem; margin-bottom: 3rem; }
        @media(min-width: 1024px) { .sovtall-head { grid-template-columns: 1fr 1fr; align-items: flex-end; } }
        .sovtall-eyebrow { display: inline-flex; align-items: center; gap: 0.5rem; color: var(--c-accent); font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 1rem; }
        .sovtall-dot { width: 0.375rem; height: 0.375rem; border-radius: 50%; background: var(--c-accent); }
        .sovtall-h2 { font-family: var(--font-heading); font-weight: 800; font-size: clamp(1.75rem, 4vw, 3rem); letter-spacing: -0.03em; color: var(--c-ink); line-height: 1.15; }
        .sovtall-sub { color: var(--c-muted); font-size: 1rem; line-height: 1.6; }
        .sovtall-grid { display: grid; gap: 1.5rem; }
        @media(min-width: 768px) { .sovtall-grid { grid-template-columns: repeat(3, 1fr); } }
        .sovtall-card { position: relative; border-radius: var(--r-xl); overflow: hidden; height: 420px; }
        .sovtall-card img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .7s; }
        .sovtall-card:hover img { transform: scale(1.05); }
        .sovtall-overlay { position: absolute; inset: 0; background: linear-gradient(to top, color-mix(in srgb, var(--c-ink) 90%, transparent) 0%, color-mix(in srgb, var(--c-ink) 30%, transparent) 50%, transparent 100%); }
        .sovtall-body { position: absolute; bottom: 0; left: 0; right: 0; padding: 1.5rem; }
        .sovtall-cardtitle { color: #fff; font-family: var(--font-heading); font-weight: 700; font-size: 1.25rem; margin-bottom: 0.5rem; }
        .sovtall-carddesc { color: rgba(255,255,255,.7); font-size: 0.875rem; line-height: 1.55; max-width: 20rem; }
      `}</style>
      <div className="sovtall-inner">
        <div className="sovtall-head">
          <div>
            <p className="sovtall-eyebrow"><span className="sovtall-dot" />{label}</p>
            <h2 className="sovtall-h2">{title}</h2>
          </div>
          {subtitle && <p className="sovtall-sub">{subtitle}</p>}
        </div>
        <div className="sovtall-grid">
          {items.map((item, i) => (
            <div key={i} className="sovtall-card">
              {item.image && <img src={item.image} alt="" />}
              <div className="sovtall-overlay" />
              <div className="sovtall-body">
                <h3 className="sovtall-cardtitle">{item.title}</h3>
                {item.desc && <p className="sovtall-carddesc">{item.desc}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
