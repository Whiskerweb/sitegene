// (Jazz Vocalist) Hero plein écran photo N&B, overlay dégradé encre, titre sérif géant centré + labels bas.
import type { Skin } from "@/lib/foundry/types";

interface JVHeroContent {
  eyebrow: string;
  title: string;
  tagline: string;
  leftLabel: string;
  rightLabel: string;
  image: string;
}

export default function JazzVocalistHero({ content, skin }: { content: JVHeroContent; skin: Skin }) {
  const accent = skin.accent ?? "var(--c-accent)";
  const img =
    typeof content.image === "string" && content.image
      ? content.image
      : "/_templates/jazz-vocalist/img/hero.jpg";
  return (
    <section
      className="jvhero"
      style={{ background: "var(--c-panel)", position: "relative", minHeight: "100svh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}
    >
      <style>{`
        .jvhero-img {
          position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: cover; filter: grayscale(1);
        }
        .jvhero-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to bottom, rgba(0,0,0,.70) 0%, rgba(0,0,0,.30) 50%, rgba(0,0,0,1) 100%);
        }
        .jvhero-body { position: relative; z-index: 10; text-align: center; padding: 0 1.5rem; }
        /* Les textes reposent sur le voile photo NOIR (fixe) : ils doivent rester
           clairs quelle que soit la charte — jamais de vars sémantiques ici. */
        .jvhero-eyebrow {
          font-family: var(--font-body, 'DM Mono', monospace);
          font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase;
          color: rgba(255,255,255,0.68); margin-bottom: 1.5rem;
        }
        .jvhero-title {
          font-family: var(--font-heading, 'EB Garamond', serif);
          font-size: clamp(4rem, 12vw, 9rem); font-weight: 500;
          line-height: 1; color: rgba(255,255,255,0.97);
          margin: 0;
        }
        .jvhero-tagline {
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: 1rem; color: rgba(255,255,255,0.78);
          max-width: 38ch; margin: 2rem auto 0;
          line-height: 1.6;
        }
        .jvhero-corners {
          position: absolute; bottom: 1.5rem; inset-inline: 0;
          z-index: 10; display: flex; justify-content: space-between;
          padding: 0 1.5rem;
          font-family: var(--font-body, 'DM Mono', monospace);
          font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase;
          color: rgba(255,255,255,0.5);
        }
      `}</style>
      <img className="jvhero-img" src={img} alt="" />
      <div className="jvhero-overlay" aria-hidden />
      <div className="jvhero-body">
        <p className="jvhero-eyebrow">{content.eyebrow ?? "Vocalist"}</p>
        <h1 className="jvhero-title">{content.title ?? "Artiste"}</h1>
        <p className="jvhero-tagline">{content.tagline ?? ""}</p>
      </div>
      <div className="jvhero-corners" aria-hidden>
        <span>{content.leftLabel ?? ""}</span>
        <span>{content.rightLabel ?? ""}</span>
      </div>
    </section>
  );
}
