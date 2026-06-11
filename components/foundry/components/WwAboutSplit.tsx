// (Wedding Warm) Section À propos : titre centré géant, grille 3 colonnes portrait + bio + image détail.
import type { Skin } from "@/lib/foundry/types";

export default function WwAboutSplit({ content, skin }: { content: any; skin: Skin }) {
  const label = typeof content.label === "string" ? content.label : "À propos";
  const heading = typeof content.heading === "string" ? content.heading : "";
  const paragraphs: string[] = Array.isArray(content.paragraphs) ? content.paragraphs : [];
  const cta = typeof content.cta === "string" ? content.cta : "En savoir plus";
  const portrait = typeof content.portrait === "string" ? content.portrait : "";
  const detail = typeof content.detail === "string" ? content.detail : "";
  return (
    <section id="about" className="wwabout" style={{ background: "var(--c-surface)", color: "var(--c-ink)" }}>
      <style>{`
        .wwabout { padding: 6rem 3rem 9rem; }
        .wwabout__bigLabel {
          font-family: var(--font-heading); text-align: center;
          font-size: clamp(3rem, 8vw, 6rem); margin-bottom: 5rem;
          color: var(--c-ink);
        }
        .wwabout__grid {
          max-width: 1152px; margin: 0 auto;
          display: grid; grid-template-columns: 1fr;
          gap: 2.5rem; align-items: center;
        }
        @media (min-width: 768px) {
          .wwabout__grid { grid-template-columns: 4fr 5fr 3fr; }
        }
        .wwabout__portrait { width: 100%; aspect-ratio: 3/4; object-fit: cover; }
        .wwabout__text { text-align: center; padding: 0 0.5rem; }
        .wwabout__heading {
          font-family: var(--font-heading); font-size: clamp(2rem, 4vw, 3rem);
          margin-bottom: 1.5rem; color: var(--c-ink);
        }
        .wwabout__para {
          color: var(--c-muted); font-size: 0.875rem; line-height: 1.7;
          margin-bottom: 1rem;
        }
        .wwabout__cta {
          display: inline-block; border: 1px solid color-mix(in srgb, var(--c-ink) 40%, transparent);
          font-size: 0.6875rem; letter-spacing: 0.2em; text-transform: uppercase;
          padding: 1rem 1.75rem; color: var(--c-ink); text-decoration: none;
          transition: background-color 0.4s ease, color 0.4s ease;
          margin-top: 2rem;
        }
        .wwabout__cta:hover { background: var(--c-ink); color: var(--c-surface); }
        .wwabout__detail { width: 100%; aspect-ratio: 1/1; object-fit: cover; }
        @media (max-width: 640px) { .wwabout { padding: 4rem 1.25rem 6rem; } }
      `}</style>
      <h2 className="wwabout__bigLabel">{label}</h2>
      <div className="wwabout__grid">
        <div>{portrait && <img src={portrait} alt="" className="wwabout__portrait" />}</div>
        <div className="wwabout__text">
          <h3 className="wwabout__heading">{heading}</h3>
          {paragraphs.map((p, i) => <p key={i} className="wwabout__para">{p}</p>)}
          <a href="#contact" className="wwabout__cta">{cta}</a>
        </div>
        <div>{detail && <img src={detail} alt="" className="wwabout__detail" />}</div>
      </div>
    </section>
  );
}
