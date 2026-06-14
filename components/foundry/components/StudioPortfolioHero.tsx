// (Studio Portfolio) Hero éditorial fond sombre : titre médium, bandeau 3 tags blanc sur noir, giant wordmark en bas.
import type { Skin } from "@/lib/foundry/types";

export default function StudioPortfolioHero({ content, skin }: { content: any; skin: Skin }) {
  const headline: string = typeof content.headline === "string" ? content.headline : "Design & Code";
  const tags: string[] = Array.isArray(content.tags) ? content.tags : [];
  const wordmark: string = typeof content.wordmark === "string" ? content.wordmark : "";

  return (
    <section className="sphero" style={{ "--c-accent": skin.accent } as React.CSSProperties}>
      <style>{`
        .sphero {
          position: relative; padding: 160px 40px 0; overflow: hidden;
          background: var(--c-ink, #000);
        }
        .sphero h1 {
          max-width: 680px; font-size: clamp(28px,4.4vw,49px);
          font-weight: 500; line-height: 1.08; letter-spacing: -0.02em;
          color: var(--c-surface, #fff); font-family: var(--font-heading);
        }
        .sphero-tags {
          position: relative; margin-top: 96px;
          background: var(--c-surface, #fff);
          display: grid; grid-template-columns: repeat(3, 1fr);
          max-width: 1000px;
        }
        .sphero-tag {
          padding: 10px 8px; font-size: 15px; font-weight: 500;
          color: var(--c-ink, #000); font-family: var(--font-body);
          border-right: 1px solid rgba(0,0,0,0.1);
        }
        .sphero-tag:last-child { border-right: none; }
        .sphero-wordmark {
          margin-top: 32px; user-select: none; line-height: 0.82;
          font-size: clamp(72px,17vw,236px); font-weight: 600; letter-spacing: -0.04em;
          color: var(--c-surface, #fff); white-space: nowrap;
          font-family: var(--font-heading);
        }
        @media (max-width: 768px) {
          .sphero { padding: 120px 24px 0; }
          .sphero-tags { grid-template-columns: 1fr; }
          .sphero-tag { border-right: none; border-bottom: 1px solid rgba(0,0,0,0.1); }
        }
      `}</style>
      <h1>{headline}</h1>
      {tags.length > 0 && (
        <div className="sphero-tags">
          {tags.map((t, i) => <div key={i} className="sphero-tag">{t}</div>)}
        </div>
      )}
      {wordmark && (
        <div className="sphero-wordmark" aria-hidden="true">
          {wordmark}<sup style={{ fontSize: "0.22em", fontWeight: 500 }}>™</sup>
        </div>
      )}
    </section>
  );
}
