// (Electrician Pro) Bento grid « Pourquoi nous » : stat, carte sombre, cartes images.
import type { Skin } from "@/lib/foundry/types";

interface WhyCard { title: string; image?: string }
interface WhyContent {
  label: string; title: string;
  statValue: string; statLabel: string;
  cards: { response: WhyCard; experience: WhyCard; safety: WhyCard; care: WhyCard; quality: WhyCard };
}

export default function WhyUsBento({ content, skin }: { content: any; skin: Skin }) {
  const label = typeof content.label === "string" ? content.label : "Pourquoi nous";
  const title = typeof content.title === "string" ? content.title : "Pourquoi nous choisir";
  const statValue = typeof content.statValue === "string" ? content.statValue : "1 000";
  const statLabel = typeof content.statLabel === "string" ? content.statLabel : "Missions réalisées";
  const c = content.cards ?? {};
  const response = c.response ?? {};
  const experience = c.experience ?? {};
  const safety = c.safety ?? {};
  const care = c.care ?? {};
  const quality = c.quality ?? {};
  return (
    <section className="wubento" style={{ background: "var(--c-surface)" }}>
      <style>{`
        .wubento { padding: 5rem 1.5rem; }
        .wubento-inner { max-width: 90rem; margin: 0 auto; }
        .wubento-head { text-align: center; margin-bottom: 3rem; }
        .wubento-eyebrow { display: inline-flex; align-items: center; gap: 0.5rem; color: var(--c-accent); font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 1rem; }
        .wubento-dot { width: 0.375rem; height: 0.375rem; border-radius: 50%; background: var(--c-accent); }
        .wubento-h2 { font-family: var(--font-heading); font-weight: 800; font-size: clamp(1.75rem, 4vw, 3rem); letter-spacing: -0.03em; color: var(--c-ink); max-width: 40rem; margin: 0 auto; }
        .wubento-grid { display: grid; grid-template-columns: 1fr; gap: 1.25rem; }
        @media(min-width: 768px) { .wubento-grid { grid-template-columns: repeat(3, 1fr); } }
        .wubento-stat { background: var(--c-card); border-radius: var(--r-card); padding: 2rem; display: flex; flex-direction: column; justify-content: center; }
        .wubento-stars { color: var(--c-accent); font-size: 0.875rem; margin-bottom: 0.75rem; }
        .wubento-statval { font-family: var(--font-heading); font-weight: 800; font-size: 3rem; letter-spacing: -0.04em; color: var(--c-ink); }
        .wubento-statlbl { color: var(--c-muted); font-size: 0.875rem; margin-top: 0.25rem; }
        .wubento-dark { background: var(--c-panel); border-radius: var(--r-card); padding: 2rem; min-height: 200px; display: flex; flex-direction: column; justify-content: flex-end; }
        .wubento-dark-title { color: var(--c-on-panel); font-family: var(--font-heading); font-weight: 700; font-size: 1.5rem; letter-spacing: -0.02em; }
        .wubento-imgcard { position: relative; border-radius: var(--r-card); overflow: hidden; min-height: 200px; }
        .wubento-imgcard img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        .wubento-imgcard-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,.65), transparent); }
        .wubento-imgcard-title { position: absolute; bottom: 1.5rem; left: 1.5rem; right: 1.5rem; color: var(--c-surface); font-family: var(--font-heading); font-weight: 700; font-size: 1.5rem; letter-spacing: -0.02em; }
        .wubento-plain { background: var(--c-card); border-radius: var(--r-card); padding: 2rem; display: flex; align-items: center; min-height: 200px; }
        .wubento-plain-title { color: var(--c-ink); font-family: var(--font-heading); font-weight: 700; font-size: 1.5rem; letter-spacing: -0.02em; }
      `}</style>
      <div className="wubento-inner">
        <div className="wubento-head">
          <p className="wubento-eyebrow"><span className="wubento-dot" />{label}</p>
          <h2 className="wubento-h2">{title}</h2>
        </div>
        <div className="wubento-grid">
          {/* Stat */}
          <div className="wubento-stat">
            <div className="wubento-stars">★★★★★</div>
            <div className="wubento-statval">{statValue}</div>
            <div className="wubento-statlbl">{statLabel}</div>
          </div>
          {/* Dark card */}
          <div className="wubento-dark">
            <svg width="40" height="40" fill="none" stroke="var(--c-accent)" strokeWidth="1.6" viewBox="0 0 24 24" style={{ marginBottom: "1.5rem" }}>
              <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
            </svg>
            <h3 className="wubento-dark-title">{response.title ?? "Intervention rapide"}</h3>
          </div>
          {/* Experience image */}
          <div className="wubento-imgcard">
            {experience.image && <img src={experience.image} alt="" />}
            <div className="wubento-imgcard-overlay" />
            <h3 className="wubento-imgcard-title">{experience.title ?? "15+ ans d'expérience"}</h3>
          </div>
          {/* Safety plain */}
          <div className="wubento-plain">
            <h3 className="wubento-plain-title">{safety.title ?? "La sécurité avant tout"}</h3>
          </div>
          {/* Care image */}
          <div className="wubento-imgcard">
            {care.image && <img src={care.image} alt="" />}
            <div className="wubento-imgcard-overlay" />
            <h3 className="wubento-imgcard-title">{care.title ?? "Votre satisfaction compte"}</h3>
          </div>
          {/* Quality image */}
          <div className="wubento-imgcard">
            {quality.image && <img src={quality.image} alt="" />}
            <div className="wubento-imgcard-overlay" />
            <h3 className="wubento-imgcard-title">{quality.title ?? "Travail de qualité"}</h3>
          </div>
        </div>
      </div>
    </section>
  );
}
