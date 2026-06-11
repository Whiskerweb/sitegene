// (Multi-Trade) Hero sombre fond pleine image avec gradient, pillules de preuves à droite.
import type { Skin } from "@/lib/foundry/types";

export default function MultiTradeHero({ content, skin }: { content: any; skin: Skin }) {
  const title = typeof content.title === "string" ? content.title : "Des solutions expertes";
  const tagline = typeof content.tagline === "string" ? content.tagline : "";
  const cta = typeof content.cta === "string" ? content.cta : "Demander un devis";
  const image = typeof content.image === "string" ? content.image : "";
  const pills: string[] = Array.isArray(content.pills) ? content.pills : [];
  return (
    <section className="mthero" style={{ background: "var(--c-ink)" }}>
      <style>{`
        .mthero { position: relative; overflow: hidden; min-height: 640px; display: flex; align-items: flex-end; }
        .mthero-bg { position: absolute; inset: 0; }
        .mthero-bg img { width: 100%; height: 100%; object-fit: cover; }
        .mthero-overlay { position: absolute; inset: 0; background: linear-gradient(to right, var(--c-ink) 0%, color-mix(in srgb, var(--c-ink) 85%, transparent) 55%, color-mix(in srgb, var(--c-ink) 30%, transparent) 100%); }
        .mthero-overlay2 { position: absolute; inset: 0; background: linear-gradient(to top, var(--c-ink) 0%, transparent 45%, color-mix(in srgb, var(--c-ink) 40%, transparent) 100%); }
        .mthero-inner { position: relative; width: 100%; max-width: 90rem; margin: 0 auto; padding: 10rem 1.5rem 4rem; display: grid; gap: 2.5rem; align-items: flex-end; }
        @media(min-width: 1024px) { .mthero-inner { grid-template-columns: 1fr 1fr; } }
        .mthero-copy { }
        .mthero-h1 { font-family: var(--font-heading); font-weight: 800; font-size: clamp(2rem, 5vw, 3.75rem); line-height: 1.05; letter-spacing: -0.03em; color: #fff; max-width: 32rem; margin-bottom: 1.5rem; }
        .mthero-tagline { color: rgba(255,255,255,.7); font-size: 1.125rem; max-width: 28rem; margin-bottom: 2rem; line-height: 1.6; }
        .mthero-cta { display: inline-flex; align-items: center; gap: 0.75rem; background: var(--c-accent); color: #fff; font-weight: 600; font-size: 0.875rem; padding: 0.875rem 1.5rem; border-radius: var(--r-pill); text-decoration: none; transition: filter .2s; }
        .mthero-cta:hover { filter: brightness(1.1); }
        .mthero-cta svg { flex-shrink: 0; }
        .mthero-pills { display: none; flex-direction: column; align-items: flex-end; gap: 0.75rem; }
        @media(min-width: 1024px) { .mthero-pills { display: flex; } }
        .mthero-pill { display: inline-flex; align-items: center; gap: 0.625rem; background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.15); border-radius: var(--r-pill); padding: 0.625rem 1.25rem; }
        .mthero-pill-dot { width: 1.25rem; height: 1.25rem; background: var(--c-accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .mthero-pill-text { color: #fff; font-size: 0.875rem; font-weight: 500; }
      `}</style>
      <div className="mthero-bg">
        {image && <img src={image} alt="" />}
        <div className="mthero-overlay" />
        <div className="mthero-overlay2" />
      </div>
      <div className="mthero-inner">
        <div className="mthero-copy">
          <h1 className="mthero-h1">{title}</h1>
          <p className="mthero-tagline">{tagline}</p>
          <a href="#contact" className="mthero-cta">
            {cta}
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M5 12h14M13 6l6 6-6 6"/>
            </svg>
          </a>
        </div>
        {pills.length > 0 && (
          <div className="mthero-pills">
            {pills.map((p, i) => (
              <div key={i} className="mthero-pill">
                <span className="mthero-pill-dot">
                  <svg width="12" height="12" fill="#fff" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                </span>
                <span className="mthero-pill-text">{p}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
