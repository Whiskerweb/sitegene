// (Jazz Vocalist) Grille 2×2 de citations sérif italique avec auteur/lieu, fond sombre encre.
import type { Skin } from "@/lib/foundry/types";

interface Quote { quote: string; author: string; place: string }
interface JVTestimonialsContent { label: string; items: Quote[] }

export default function JazzVocalistTestimonials({ content, skin }: { content: JVTestimonialsContent; skin: Skin }) {
  const items: Quote[] = Array.isArray(content.items) ? content.items : [];
  const label = typeof content.label === "string" ? content.label : "Témoignages";
  return (
    <section className="jvtm" style={{ background: "var(--c-ink)" }}>
      <style>{`
        .jvtm {
          padding: 7rem 1.5rem;
        }
        .jvtm-inner {
          max-width: 80rem; margin: 0 auto;
          display: grid; grid-template-columns: 200px 1fr; gap: 2.5rem;
        }
        @media (max-width: 640px) { .jvtm-inner { grid-template-columns: 1fr; } }
        .jvtm-label {
          font-family: var(--font-body, 'DM Mono', monospace);
          font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase;
          color: var(--c-muted);
        }
        .jvtm-grid {
          display: grid; grid-template-columns: repeat(2, 1fr);
          gap: 3rem;
        }
        @media (max-width: 640px) { .jvtm-grid { grid-template-columns: 1fr; } }
        .jvtm-quote {
          font-family: var(--font-heading, 'EB Garamond', serif);
          font-style: italic; font-size: 1.35rem;
          line-height: 1.4; color: var(--c-surface);
          margin: 0 0 1rem;
        }
        .jvtm-author {
          font-family: var(--font-body, 'DM Mono', monospace);
          font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--c-muted); display: block;
        }
        .jvtm-place {
          font-family: var(--font-body, 'DM Mono', monospace);
          font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--c-muted); display: block;
        }
      `}</style>
      <div className="jvtm-inner">
        <p className="jvtm-label">{label}</p>
        <div className="jvtm-grid">
          {items.map((q, i) => (
            <blockquote key={i}>
              <p className="jvtm-quote">{q.quote ?? ""}</p>
              <footer>
                <span className="jvtm-author">{q.author ?? ""}</span>
                <span className="jvtm-place">{q.place ?? ""}</span>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
