// (Jazz Vocalist / Electronic Collective) Liste de concerts : date · heure · titre · salle, filets monospaces.
import type { Skin } from "@/lib/foundry/types";

interface DateItem { date: string; time?: string; title: string; venue: string; city?: string; status?: string }
interface DatesContent { label: string; items: DateItem[]; moreCta?: string }

export default function MusicianDatesTable({ content, skin }: { content: DatesContent; skin: Skin }) {
  const items: DateItem[] = Array.isArray(content.items) ? content.items : [];
  const label = typeof content.label === "string" ? content.label : "Dates";
  return (
    <section className="mdt" style={{ background: "var(--c-ink)" }}>
      <style>{`
        .mdt {
          padding: 7rem 1.5rem;
          border-top: 1px solid rgba(255,255,255,.08);
        }
        .mdt-inner {
          max-width: 80rem; margin: 0 auto;
          display: grid; grid-template-columns: 200px 1fr; gap: 2.5rem;
        }
        @media (max-width: 640px) { .mdt-inner { grid-template-columns: 1fr; } }
        .mdt-label {
          font-family: var(--font-body, 'DM Mono', monospace);
          font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase;
          color: var(--c-muted);
        }
        .mdt-list { border-top: 1px solid rgba(255,255,255,.08); }
        .mdt-row {
          display: grid;
          grid-template-columns: 130px 70px 1fr;
          gap: 1rem; padding: 1.5rem 0;
          border-bottom: 1px solid rgba(255,255,255,.08);
          align-items: baseline;
        }
        @media (max-width: 600px) {
          .mdt-row { grid-template-columns: 1fr; gap: .35rem; }
        }
        .mdt-date {
          font-family: var(--font-body, 'DM Mono', monospace);
          font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--c-muted);
        }
        .mdt-time {
          font-family: var(--font-body, 'DM Mono', monospace);
          font-size: 11px; color: var(--c-muted);
        }
        .mdt-title {
          font-family: var(--font-heading, 'EB Garamond', serif);
          font-size: 1.2rem; color: var(--c-surface); display: block;
        }
        .mdt-venue {
          font-family: var(--font-body, 'DM Mono', monospace);
          font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--c-muted); display: block; margin-top: .2rem;
        }
        .mdt-status {
          font-family: var(--font-body, 'DM Mono', monospace);
          font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--c-accent);
          border: 1px solid rgba(255,255,255,.15);
          padding: .25rem .75rem;
          white-space: nowrap;
          align-self: center;
          justify-self: end;
        }
        .mdt-more {
          display: inline-block; margin-top: 2rem;
          font-family: var(--font-body, 'DM Mono', monospace);
          font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase;
          color: var(--c-accent);
          text-decoration: none;
        }
        .mdt-more:hover { color: var(--c-surface); }
      `}</style>
      <div className="mdt-inner">
        <p className="mdt-label">{label}</p>
        <div>
          <ul className="mdt-list">
            {items.map((d, i) => (
              <li key={i} className="mdt-row">
                <span className="mdt-date">{d.date ?? "—"}</span>
                <span className="mdt-time">{d.time ?? ""}</span>
                <div>
                  <span className="mdt-title">{d.title ?? "—"}</span>
                  <span className="mdt-venue">{d.venue ?? d.city ?? ""}</span>
                </div>
                {d.status && <span className="mdt-status">{d.status}</span>}
              </li>
            ))}
          </ul>
          {content.moreCta && (
            <a href="#" className="mdt-more">{content.moreCta}</a>
          )}
        </div>
      </div>
    </section>
  );
}
