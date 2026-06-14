// (Jazz Vocalist) Bandeau de salles de concert / collaborations texte mono séparées par points.
import type { Skin } from "@/lib/foundry/types";

interface VenuesContent { items: string[] }

export default function MusicianVenuesBanner({ content, skin }: { content: VenuesContent; skin: Skin }) {
  const items: string[] = Array.isArray(content.items) ? content.items : [];
  return (
    <div className="mvb" style={{ borderTop: "1px solid rgba(255,255,255,.08)", borderBottom: "1px solid rgba(255,255,255,.08)", background: "var(--c-panel)" }}>
      <style>{`
        .mvb { padding: 1.25rem 1.5rem; overflow: hidden; }
        .mvb-inner {
          max-width: 80rem; margin: 0 auto;
          display: flex; flex-wrap: wrap; gap: .5rem 2rem;
          font-family: var(--font-body, 'DM Mono', monospace);
          font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;
          color: color-mix(in srgb, var(--c-muted) 80%, transparent);
        }
        .mvb-sep { color: rgba(255,255,255,.2); }
      `}</style>
      <div className="mvb-inner">
        {items.map((v, i) => (
          <>
            <span key={`v-${i}`}>{v}</span>
            {i < items.length - 1 && <span key={`s-${i}`} className="mvb-sep">·</span>}
          </>
        ))}
      </div>
    </div>
  );
}
