// (Wedding Warm) Témoignage : citation serif centrée sur image sombre pleine largeur.
import type { Skin } from "@/lib/foundry/types";

export default function WwTestimonialOverlay({ content, skin }: { content: any; skin: Skin }) {
  const heading = typeof content.heading === "string" ? content.heading : "Mots de Clients";
  const intro = typeof content.intro === "string" ? content.intro : "";
  const image = typeof content.image === "string" ? content.image : "";
  const items: Array<{ quote: string; name: string }> = Array.isArray(content.items) ? content.items : [];
  const first = items[0] ?? { quote: "", name: "" };
  return (
    <section className="wwtesti" style={{ background: "var(--c-ink)", color: "var(--c-surface)" }}>
      <style>{`
        .wwtesti { position: relative; padding: 6rem 3rem 9rem; overflow: hidden; }
        .wwtesti__header { text-align: center; max-width: 42rem; margin: 0 auto 4rem; position: relative; z-index: 10; }
        .wwtesti__heading {
          font-family: var(--font-heading); font-size: clamp(3rem, 8vw, 6rem);
          margin-bottom: 1.5rem; color: var(--c-surface);
        }
        .wwtesti__intro { color: color-mix(in srgb, var(--c-surface) 60%, transparent); font-size: 0.875rem; line-height: 1.7; max-width: 28rem; margin: 0 auto; }
        .wwtesti__card {
          position: relative; max-width: 62.5rem; margin: 0 auto;
          height: 480px; border-radius: var(--r-card); overflow: hidden;
        }
        .wwtesti__img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        .wwtesti__dim { position: absolute; inset: 0; background: rgba(0,0,0,0.45); }
        .wwtesti__body {
          position: relative; z-index: 10; height: 100%;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          text-align: center; padding: 2rem;
        }
        .wwtesti__quote {
          font-family: var(--font-heading); font-size: clamp(1.25rem, 3vw, 2.25rem);
          color: var(--c-surface); line-height: 1.35; max-width: 48rem; margin-bottom: 1.5rem;
        }
        .wwtesti__name {
          font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.2em;
          color: rgba(255,255,255,0.8);
        }
        @media (max-width: 640px) {
          .wwtesti { padding: 4rem 1.25rem 6rem; }
          .wwtesti__card { height: 360px; }
        }
      `}</style>
      <div className="wwtesti__header">
        <h2 className="wwtesti__heading">{heading}</h2>
        {intro && <p className="wwtesti__intro">{intro}</p>}
      </div>
      <div className="wwtesti__card">
        {image && <img src={image} alt="" className="wwtesti__img" />}
        <div className="wwtesti__dim" />
        <div className="wwtesti__body">
          {first.quote && <p className="wwtesti__quote">{first.quote}</p>}
          {first.name && <span className="wwtesti__name">{first.name}</span>}
        </div>
      </div>
    </section>
  );
}
