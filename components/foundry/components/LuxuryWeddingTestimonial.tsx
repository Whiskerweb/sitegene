// (Luxury Wedding) Témoignage unique centré avec guillemet géant, citation typographiée et attribution.
import type { Skin } from "@/lib/foundry/types";

export default function LuxuryWeddingTestimonial({ content, skin }: { content: any; skin: Skin }) {
  const quote = typeof content.quote === "string" ? content.quote : "Un travail d'exception, des souvenirs inoubliables.";
  const name = typeof content.name === "string" ? content.name : "Nom Prénom";
  const venue = typeof content.venue === "string" ? content.venue : "";

  return (
    <section className="lwtesti" style={{ background: "var(--c-ink)" }}>
      <style>{`
        .lwtesti {
          padding: 8rem 1.5rem;
          color: var(--c-surface);
          text-align: center;
        }
        .lwtesti-glyph {
          font-size: 6rem;
          color: color-mix(in srgb, var(--c-surface) 6%, transparent);
          display: block;
          margin-bottom: 1.5rem;
          line-height: 1;
          font-family: var(--font-heading);
          letter-spacing: -0.04em;
        }
        .lwtesti-quote {
          font-family: var(--font-heading);
          font-size: clamp(1.5rem, 4vw, 3.5rem);
          font-weight: 300;
          letter-spacing: -0.03em;
          line-height: 1.3;
          color: var(--c-surface);
          max-width: 60rem;
          margin: 0 auto 3rem auto;
        }
        .lwtesti-name {
          font-family: var(--font-body);
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: var(--c-surface);
          font-weight: 300;
          margin-bottom: 0.5rem;
        }
        .lwtesti-venue {
          font-family: var(--font-body);
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: color-mix(in srgb, var(--c-surface) 40%, transparent);
          font-weight: 200;
        }
      `}</style>

      <span className="lwtesti-glyph">"</span>
      <blockquote className="lwtesti-quote">{quote}</blockquote>
      <p className="lwtesti-name">{name}</p>
      {venue && <p className="lwtesti-venue">{venue}</p>}
    </section>
  );
}
