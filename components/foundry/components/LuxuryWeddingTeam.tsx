// (Luxury Wedding) Équipe en 2 colonnes décalées verticalement avec photos grand format, désaturation au hover inversée, bio et rôle.
import type { Skin } from "@/lib/foundry/types";

interface TeamMember { name: string; role: string; bio: string; image: string }

export default function LuxuryWeddingTeam({ content, skin }: { content: any; skin: Skin }) {
  const label = typeof content.label === "string" ? content.label : "L'équipe";
  const heading1 = typeof content.heading1 === "string" ? content.heading1 : "Vision & Craft";
  const heading2 = typeof content.heading2 === "string" ? content.heading2 : "Behind the Lens";
  const intro = typeof content.intro === "string" ? content.intro : "";
  const members: TeamMember[] = Array.isArray(content.members) ? content.members : [
    { name: "Photographe", role: "Lead Photographer", bio: "", image: "/_templates/luxury-wedding/img/team-photographer.jpg" },
    { name: "Cinéaste", role: "Lead Cinematographer", bio: "", image: "/_templates/luxury-wedding/img/team-cinematographer.jpg" },
  ];

  return (
    <section className="lwteam" style={{ background: "var(--c-ink)" }}>
      <style>{`
        .lwteam {
          padding: 6rem 0;
          overflow: hidden;
          position: relative;
        }
        .lwteam::before {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(circle 500px at 50% 100px, rgba(249,115,22,0.18), transparent);
          pointer-events: none;
          z-index: 0;
        }
        .lwteam-inner {
          position: relative;
          z-index: 1;
          max-width: 90rem;
          margin: 0 auto;
          padding: 0 1.5rem;
        }
        @media (min-width: 1024px) { .lwteam-inner { padding: 0 3rem; } }
        .lwteam-header {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          margin-bottom: 4rem;
          align-items: flex-start;
          justify-content: space-between;
        }
        @media (min-width: 768px) {
          .lwteam-header { flex-direction: row; align-items: flex-end; }
        }
        .lwteam-label {
          font-family: var(--font-body);
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: color-mix(in srgb, var(--c-surface) 40%, transparent);
          font-weight: 200;
          margin-bottom: 1.5rem;
          display: block;
        }
        .lwteam-htitle {
          font-size: clamp(2.5rem, 6vw, 4.5rem);
          font-family: var(--font-heading);
          font-weight: 300;
          letter-spacing: -0.04em;
          line-height: 1.1;
          color: var(--c-surface);
        }
        .lwteam-hint {
          max-width: 32rem;
          font-family: var(--font-body);
          font-size: 1.1rem;
          line-height: 1.7;
          color: color-mix(in srgb, var(--c-surface) 50%, transparent);
          font-weight: 300;
        }
        .lwteam-grid {
          display: grid;
          gap: 3rem;
        }
        @media (min-width: 768px) { .lwteam-grid { grid-template-columns: 1fr 1fr; gap: 6rem; } }
        .lwteam-card { display: flex; flex-direction: column; }
        .lwteam-card:nth-child(2) { margin-top: 0; }
        @media (min-width: 768px) { .lwteam-card:nth-child(2) { margin-top: 8rem; } }
        .lwteam-photo {
          height: 60vh;
          overflow: hidden;
          border-radius: 2px;
          margin-bottom: 2rem;
          position: relative;
        }
        @media (min-width: 768px) { .lwteam-photo { height: 70vh; } }
        .lwteam-photo img {
          width: 100%; height: 100%;
          object-fit: cover;
          filter: grayscale(100%);
          opacity: 0.8;
          transition: transform 1s ease-out, filter 1s ease-out, opacity 1s ease-out;
        }
        .lwteam-card:hover .lwteam-photo img {
          transform: scale(1.05);
          filter: grayscale(0);
          opacity: 1;
        }
        .lwteam-meta {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }
        @media (min-width: 640px) {
          .lwteam-meta { flex-direction: row; justify-content: space-between; align-items: flex-end; }
        }
        .lwteam-name {
          font-size: clamp(2rem, 4vw, 3.5rem);
          font-family: var(--font-heading);
          font-weight: 300;
          letter-spacing: -0.04em;
          color: var(--c-surface);
        }
        .lwteam-role {
          font-family: var(--font-body);
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: color-mix(in srgb, var(--c-surface) 40%, transparent);
          font-weight: 200;
        }
        .lwteam-bio {
          font-family: var(--font-body);
          font-size: 1rem;
          line-height: 1.7;
          color: color-mix(in srgb, var(--c-surface) 50%, transparent);
          font-weight: 300;
        }
      `}</style>

      <div className="lwteam-inner">
        <div className="lwteam-header">
          <div>
            <span className="lwteam-label">{label}</span>
            <h2 className="lwteam-htitle">{heading1}<br />{heading2}</h2>
          </div>
          <p className="lwteam-hint">{intro}</p>
        </div>

        <div className="lwteam-grid">
          {members.map((m, i) => (
            <div key={i} className="lwteam-card">
              <div className="lwteam-photo">
                <img src={m.image} alt={m.name} />
              </div>
              <div className="lwteam-meta">
                <h3 className="lwteam-name">{m.name}</h3>
                <span className="lwteam-role">{m.role}</span>
              </div>
              <p className="lwteam-bio">{m.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
