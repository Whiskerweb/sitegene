// (Creative Portfolio) Section About split 2 colonnes : portrait (parallaxe) + texte avec liste de services.
import type { Skin } from "@/lib/foundry/types";

export default function CreativePortfolioAbout({ content, skin }: { content: any; skin: Skin }) {
  const title: string = typeof content.section_title === "string" ? content.section_title : "À propos";
  const image: string = typeof content.image === "string" ? content.image : "";
  const paragraphs: string[] = Array.isArray(content.paragraphs) ? content.paragraphs : [];
  const servicesLabel: string = typeof content.services_label === "string" ? content.services_label : "Services";
  const services: string[] = Array.isArray(content.services) ? content.services : [];
  const cta: string = typeof content.cta === "string" ? content.cta : "En savoir plus";
  const templateBase: string = typeof content._templateBase === "string" ? content._templateBase : "";

  return (
    <section className="cpabout" style={{ "--c-accent": skin.accent } as React.CSSProperties}>
      <style>{`
        .cpabout {
          padding: 100px 40px;
          background: var(--c-ink, #000);
        }
        .cpabout-heading {
          font-size: clamp(48px, 8vw, 80px); font-weight: 700;
          letter-spacing: -0.03em; line-height: 1;
          color: var(--c-surface, #fff);
          font-family: var(--font-heading);
          border-top: 1px solid rgba(255,255,255,0.1);
          padding-top: 40px;
        }
        .cpabout-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 64px;
          margin-top: 64px; align-items: start;
        }
        .cpabout-img-wrap { overflow: hidden; }
        .cpabout-img-wrap img {
          width: 100%; aspect-ratio: 3/4; object-fit: cover; display: block;
        }
        .cpabout-text p {
          font-size: 16px; line-height: 1.7; color: var(--c-muted, #b3b3b3);
          margin-bottom: 20px; font-family: var(--font-body);
        }
        .cpabout-services-list {
          margin-top: 40px; border-top: 1px solid rgba(255,255,255,0.15);
        }
        .cpabout-services-label {
          font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase;
          color: rgba(255,255,255,0.3); margin: 24px 0 16px;
          font-family: var(--font-body);
        }
        .cpabout-service-item {
          font-size: 18px; font-weight: 700; letter-spacing: -0.01em;
          color: var(--c-surface, #fff);
          padding: 14px 0; border-bottom: 1px solid rgba(255,255,255,0.07);
          display: flex; justify-content: space-between; align-items: center;
          font-family: var(--font-heading);
        }
        .cpabout-service-item::after {
          content: '→'; color: rgba(255,255,255,0.3); font-size: 14px;
        }
        .cpabout-cta {
          margin-top: 32px; display: inline-block; font-size: 13px; font-weight: 700;
          color: var(--c-surface, #fff); text-decoration: none;
          letter-spacing: 0.06em; text-transform: uppercase;
          border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 2px;
          transition: border-color 0.2s; font-family: var(--font-body);
        }
        .cpabout-cta:hover { border-color: currentColor; }
        @media (max-width: 768px) {
          .cpabout { padding: 64px 24px; }
          .cpabout-grid { grid-template-columns: 1fr; gap: 32px; }
        }
      `}</style>
      <h2 className="cpabout-heading">{title}</h2>
      <div className="cpabout-grid">
        <div className="cpabout-img-wrap">
          {image && (
            <img
              src={templateBase ? `${templateBase}/${image}` : image}
              alt={title}
              loading="lazy"
            />
          )}
        </div>
        <div className="cpabout-text">
          {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
          {services.length > 0 && (
            <div className="cpabout-services-list">
              <p className="cpabout-services-label">{servicesLabel}</p>
              {services.map((s, i) => (
                <div key={i} className="cpabout-service-item">{s}</div>
              ))}
            </div>
          )}
          <a href="#contact" className="cpabout-cta">{cta}</a>
        </div>
      </div>
    </section>
  );
}
