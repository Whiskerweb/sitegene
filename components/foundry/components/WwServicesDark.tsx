// (Wedding Warm) Services sur fond sombre : titre/intro centrés, puis N services avec strip 5 images 3/4 + description.
import type { Skin } from "@/lib/foundry/types";

interface ServiceItem {
  title: string;
  desc: string;
  cta: string;
  strip: string[];
}

export default function WwServicesDark({ content, skin }: { content: any; skin: Skin }) {
  const label = typeof content.label === "string" ? content.label : "Services";
  const intro = typeof content.intro === "string" ? content.intro : "";
  const cta = typeof content.cta === "string" ? content.cta : "Voir les services";
  const items: ServiceItem[] = Array.isArray(content.items) ? content.items : [];
  return (
    <section id="services" className="wwsvc" style={{ background: "var(--c-ink)", color: "var(--c-surface)" }}>
      <style>{`
        .wwsvc { padding: 6rem 3rem 9rem; }
        .wwsvc__header { text-align: center; max-width: 42rem; margin: 0 auto 5rem; }
        .wwsvc__title {
          font-family: var(--font-heading); font-size: clamp(3rem, 8vw, 6rem);
          margin-bottom: 1.5rem; color: var(--c-surface);
        }
        .wwsvc__intro {
          font-family: var(--font-heading); font-size: clamp(1.25rem, 2.5vw, 1.875rem);
          color: color-mix(in srgb, var(--c-surface) 80%, transparent); line-height: 1.3; margin-bottom: 2rem;
        }
        .wwsvc__headerCta {
          display: inline-block; border: 1px solid color-mix(in srgb, var(--c-surface) 40%, transparent);
          font-size: 0.6875rem; letter-spacing: 0.2em; text-transform: uppercase;
          padding: 1rem 1.75rem; color: var(--c-surface); text-decoration: none;
          transition: background-color 0.4s ease, color 0.4s ease;
        }
        .wwsvc__headerCta:hover { background: var(--c-surface); color: var(--c-ink); }
        .wwsvc__item { max-width: 87.5rem; margin: 0 auto 5rem; }
        .wwsvc__itemHeader {
          display: flex; flex-direction: column; gap: 1.5rem;
          margin-bottom: 2rem;
        }
        @media (min-width: 768px) {
          .wwsvc__itemHeader { flex-direction: row; align-items: flex-end; justify-content: space-between; }
        }
        .wwsvc__itemTitle {
          font-family: var(--font-heading); font-size: clamp(2rem, 5vw, 3.5rem);
          color: var(--c-surface);
        }
        .wwsvc__itemRight { max-width: 28rem; text-align: right; }
        .wwsvc__itemDesc { color: color-mix(in srgb, var(--c-surface) 60%, transparent); font-size: 0.875rem; line-height: 1.7; margin-bottom: 1rem; }
        .wwsvc__itemCta {
          display: inline-block; border: 1px solid color-mix(in srgb, var(--c-surface) 30%, transparent);
          font-size: 0.6875rem; letter-spacing: 0.2em; text-transform: uppercase;
          padding: 0.75rem 1.5rem; color: var(--c-surface); text-decoration: none;
          transition: background-color 0.4s ease, color 0.4s ease;
        }
        .wwsvc__itemCta:hover { background: var(--c-surface); color: var(--c-ink); }
        .wwsvc__strip {
          display: grid; gap: 0.75rem;
          grid-template-columns: repeat(2, 1fr);
        }
        @media (min-width: 768px) { .wwsvc__strip { grid-template-columns: repeat(5, 1fr); } }
        .wwsvc__stripCell { overflow: hidden; aspect-ratio: 3/4; }
        .wwsvc__stripImg { width: 100%; height: 100%; object-fit: cover; transition: transform 1.4s cubic-bezier(0.22,1,0.36,1); }
        .wwsvc__stripCell:hover .wwsvc__stripImg { transform: scale(1.06); }
        @media (max-width: 640px) { .wwsvc { padding: 4rem 1.25rem 6rem; } }
      `}</style>
      <div className="wwsvc__header">
        <h2 className="wwsvc__title">{label}</h2>
        {intro && <p className="wwsvc__intro">{intro}</p>}
        <a href="#portfolio" className="wwsvc__headerCta">{cta}</a>
      </div>
      {items.map((item, idx) => (
        <div key={idx} className="wwsvc__item">
          <div className="wwsvc__itemHeader">
            <h3 className="wwsvc__itemTitle">{item.title}</h3>
            <div className="wwsvc__itemRight">
              {item.desc && <p className="wwsvc__itemDesc">{item.desc}</p>}
              <a href="#contact" className="wwsvc__itemCta">{item.cta || "En savoir plus"}</a>
            </div>
          </div>
          {Array.isArray(item.strip) && item.strip.length > 0 && (
            <div className="wwsvc__strip">
              {item.strip.map((src, i) => (
                <div key={i} className="wwsvc__stripCell">
                  <img src={src} alt="" className="wwsvc__stripImg" />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </section>
  );
}
