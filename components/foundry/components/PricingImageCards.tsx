// (Electrician Pro) Section tarifs : image à gauche, deux cartes (taux horaire + devis) à droite.
import type { Skin } from "@/lib/foundry/types";

export default function PricingImageCards({ content, skin }: { content: any; skin: Skin }) {
  const label = typeof content.label === "string" ? content.label : "Tarifs";
  const title = typeof content.title === "string" ? content.title : "Des tarifs adaptés à vos besoins";
  const image = typeof content.image === "string" ? content.image : "";
  const std = content.standard ?? {};
  const custom = content.custom ?? {};
  const stdIncluded: string[] = Array.isArray(std.included) ? std.included : [];
  const customIncluded: string[] = Array.isArray(custom.included) ? custom.included : [];
  return (
    <section className="pricingic" style={{ background: "var(--c-surface)" }}>
      <style>{`
        .pricingic { padding: 5rem 1.5rem; }
        .pricingic-inner { max-width: 90rem; margin: 0 auto; }
        .pricingic-head { text-align: center; margin-bottom: 3rem; }
        .pricingic-eyebrow { display: inline-flex; align-items: center; gap: 0.5rem; color: var(--c-accent); font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 1rem; }
        .pricingic-dot { width: 0.375rem; height: 0.375rem; border-radius: 50%; background: var(--c-accent); }
        .pricingic-h2 { font-family: var(--font-heading); font-weight: 800; font-size: clamp(1.75rem, 4vw, 3rem); letter-spacing: -0.03em; color: var(--c-ink); max-width: 32rem; margin: 0 auto; }
        .pricingic-body { display: grid; gap: 1.5rem; }
        @media(min-width: 1024px) { .pricingic-body { grid-template-columns: 1fr 1fr; align-items: stretch; } }
        .pricingic-imgwrap { position: relative; border-radius: var(--r-card); overflow: hidden; min-height: 420px; }
        .pricingic-imgwrap img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        .pricingic-cards { display: flex; flex-direction: column; gap: 1.5rem; }
        .pricingic-card { background: var(--c-card); border-radius: var(--r-card); padding: 2rem; }
        .pricingic-cardlabel { display: flex; align-items: center; gap: 0.5rem; color: var(--c-muted); font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 1rem; }
        .pricingic-rate { font-family: var(--font-heading); font-weight: 800; font-size: 3rem; letter-spacing: -0.04em; color: var(--c-ink); }
        .pricingic-unit { color: var(--c-muted); font-size: 0.875rem; margin-left: 0.25rem; }
        .pricingic-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem 1.5rem; margin-top: 1.5rem; }
        .pricingic-feature { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: var(--c-ink); }
        .pricingic-check { color: var(--c-accent); flex-shrink: 0; }
        .pricingic-custom-name { font-family: var(--font-heading); font-weight: 800; font-size: 3rem; letter-spacing: -0.04em; color: var(--c-ink); margin-bottom: 1.25rem; }
        .pricingic-cta { display: inline-flex; align-items: center; gap: 0.5rem; background: var(--c-accent); color: var(--c-on-accent); font-weight: 600; font-size: 0.875rem; padding: 0.75rem 1.5rem; border-radius: var(--r-pill); text-decoration: none; transition: filter .2s; }
        .pricingic-cta:hover { filter: brightness(.95); }
        .pricingic-custom-row { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1.5rem; }
        .pricingic-custom-feats { display: flex; flex-direction: column; gap: 0.625rem; }
        .pricingic-custom-sublabel { font-size: 0.75rem; font-weight: 600; color: var(--c-muted); margin-bottom: 0.25rem; }
      `}</style>
      <div className="pricingic-inner">
        <div className="pricingic-head">
          <p className="pricingic-eyebrow"><span className="pricingic-dot" />{label}</p>
          <h2 className="pricingic-h2">{title}</h2>
        </div>
        <div className="pricingic-body">
          <div className="pricingic-imgwrap">
            {image && <img src={image} alt="" />}
          </div>
          <div className="pricingic-cards">
            {/* Standard */}
            <div className="pricingic-card">
              <div className="pricingic-cardlabel">
                <span className="pricingic-dot" />
                {std.name ?? "Tarif standard"}
              </div>
              <div>
                <span className="pricingic-rate">{std.rate ?? "—"}</span>
                <span className="pricingic-unit">{std.unit ?? "/ Heure"}</span>
              </div>
              <div className="pricingic-grid">
                {stdIncluded.map((f, i) => (
                  <div key={i} className="pricingic-feature">
                    <svg className="pricingic-check" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
                    {f}
                  </div>
                ))}
              </div>
            </div>
            {/* Custom */}
            <div className="pricingic-card">
              <div className="pricingic-cardlabel">
                <svg width="14" height="14" fill="currentColor" style={{ color: "var(--c-accent)" }} viewBox="0 0 24 24">
                  <path d="M13 2 4.5 13.5H11l-1 8.5L19.5 10H13l0-8z"/>
                </svg>
                {custom.tag ?? "Sur mesure"}
              </div>
              <div className="pricingic-custom-row">
                <div>
                  <div className="pricingic-custom-name">{custom.name ?? "Sur mesure"}</div>
                  <a href="#contact" className="pricingic-cta">{custom.cta ?? "Demander un devis"}</a>
                </div>
                <div className="pricingic-custom-feats">
                  <div className="pricingic-custom-sublabel">Inclus :</div>
                  {customIncluded.map((f, i) => (
                    <div key={i} className="pricingic-feature">
                      <svg className="pricingic-check" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
