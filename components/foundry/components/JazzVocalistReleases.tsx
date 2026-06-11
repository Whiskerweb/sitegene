// (Jazz Vocalist) Tracklist / discographie : tableau sérif séparé par filets avec pochette, titre, artiste, genre.
import type { Skin } from "@/lib/foundry/types";

interface Release { title: string; artist: string; genre: string; cover: string }
interface JVReleasesContent { label: string; items: Release[] }

export default function JazzVocalistReleases({ content, skin }: { content: JVReleasesContent; skin: Skin }) {
  const items: Release[] = Array.isArray(content.items) ? content.items : [];
  const label = typeof content.label === "string" ? content.label : "Sorties";
  return (
    <section className="jvrel" style={{ background: "var(--c-ink)" }}>
      <style>{`
        .jvrel {
          padding: 7rem 1.5rem;
          border-top: 1px solid rgba(255,255,255,.08);
        }
        .jvrel-inner {
          max-width: 80rem; margin: 0 auto;
          display: grid; grid-template-columns: 200px 1fr; gap: 2.5rem;
        }
        @media (max-width: 640px) { .jvrel-inner { grid-template-columns: 1fr; } }
        .jvrel-label {
          font-family: var(--font-body, 'DM Mono', monospace);
          font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase;
          color: var(--c-muted);
        }
        .jvrel-list { border-top: 1px solid rgba(255,255,255,.08); }
        .jvrel-item {
          display: flex; align-items: center; gap: 1.25rem;
          padding: 1.25rem 0;
          border-bottom: 1px solid rgba(255,255,255,.08);
        }
        .jvrel-cover {
          width: 3.5rem; height: 3.5rem;
          object-fit: cover; filter: grayscale(1);
          border-radius: 2px; flex-shrink: 0;
        }
        .jvrel-meta { flex: 1; min-width: 0; }
        .jvrel-title {
          font-family: var(--font-heading, 'EB Garamond', serif);
          font-size: 1.25rem; color: var(--c-surface);
          display: block;
        }
        .jvrel-artist {
          font-family: var(--font-body, 'DM Mono', monospace);
          font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--c-muted); display: block; margin-top: .25rem;
        }
        .jvrel-genre {
          font-family: var(--font-body, 'DM Mono', monospace);
          font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--c-muted); white-space: nowrap; flex-shrink: 0;
        }
      `}</style>
      <div className="jvrel-inner">
        <p className="jvrel-label">{label}</p>
        <ul className="jvrel-list">
          {items.map((r, i) => (
            <li key={i} className="jvrel-item">
              <img className="jvrel-cover" src={r.cover ?? ""} alt="" />
              <div className="jvrel-meta">
                <span className="jvrel-title">{r.title ?? "—"}</span>
                <span className="jvrel-artist">{r.artist ?? ""}</span>
              </div>
              <span className="jvrel-genre">{r.genre ?? ""}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
