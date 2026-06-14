// (Electrician Pro) Grille 2×2 d'avis clients avec initiales colorées, étoiles et rôle.
import type { Skin } from "@/lib/foundry/types";

interface TestiItem { quote: string; author: string; role: string; rating?: number }

export default function TestimonialsGrid({ content, skin }: { content: any; skin: Skin }) {
  const label = typeof content.label === "string" ? content.label : "Témoignages";
  const title = typeof content.title === "string" ? content.title : "Ce que disent nos clients";
  const items: TestiItem[] = Array.isArray(content.items) ? content.items : [];
  function initials(name: string) {
    return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  }
  return (
    <section className="testigrid" style={{ background: "var(--c-surface)" }}>
      <style>{`
        .testigrid { padding: 5rem 1.5rem; }
        .testigrid-inner { max-width: 90rem; margin: 0 auto; }
        .testigrid-head { text-align: center; margin-bottom: 3rem; }
        .testigrid-eyebrow { display: inline-flex; align-items: center; gap: 0.5rem; color: var(--c-accent); font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 1rem; }
        .testigrid-dot { width: 0.375rem; height: 0.375rem; border-radius: 50%; background: var(--c-accent); }
        .testigrid-h2 { font-family: var(--font-heading); font-weight: 800; font-size: clamp(1.75rem, 4vw, 3rem); letter-spacing: -0.03em; color: var(--c-ink); max-width: 40rem; margin: 0 auto; }
        .testigrid-grid { display: grid; gap: 1.5rem; }
        @media(min-width: 768px) { .testigrid-grid { grid-template-columns: repeat(2, 1fr); } }
        .testigrid-card { background: var(--c-card); border-radius: var(--r-card); padding: 1.75rem; display: flex; flex-direction: column; gap: 1rem; }
        .testigrid-stars { color: var(--c-accent); font-size: 0.875rem; }
        .testigrid-quote { color: var(--c-muted); font-size: 0.875rem; line-height: 1.7; flex: 1; }
        .testigrid-footer { display: flex; align-items: center; gap: 0.75rem; padding-top: 0.5rem; }
        .testigrid-avatar { width: 2.25rem; height: 2.25rem; border-radius: 50%; background: color-mix(in srgb, var(--c-accent) 15%, transparent); color: var(--c-accent); font-weight: 600; display: flex; align-items: center; justify-content: center; font-size: 0.875rem; flex-shrink: 0; }
        .testigrid-author { font-weight: 600; font-size: 0.875rem; color: var(--c-ink); }
        .testigrid-role { font-size: 0.75rem; color: var(--c-muted); }
      `}</style>
      <div className="testigrid-inner">
        <div className="testigrid-head">
          <p className="testigrid-eyebrow"><span className="testigrid-dot" />{label}</p>
          <h2 className="testigrid-h2">{title}</h2>
        </div>
        <div className="testigrid-grid">
          {items.map((item, i) => (
            <div key={i} className="testigrid-card">
              <div className="testigrid-stars">★★★★★</div>
              <p className="testigrid-quote">{item.quote}</p>
              <div className="testigrid-footer">
                <div className="testigrid-avatar">{initials(item.author ?? "?")}</div>
                <div>
                  <div className="testigrid-author">{item.author}</div>
                  <div className="testigrid-role">{item.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
