// components/foundry/components/ImageMarquee.tsx
// Import adapté (style « marquee cards ») : bandeau d'images en défilement continu ;
// au survol d'une image elle se réduit et révèle son titre. Pause au survol du
// bandeau. CSS pur (keyframes) → rendable serveur. Modulable (N images).
import type { Skin } from "@/lib/foundry/types";
import { Eyebrow } from "../primitives";

interface Item { image: string; title?: string }

export default function ImageMarquee({ content }: { content: any; skin: Skin }) {
  const items: Item[] = Array.isArray(content?.items) ? content.items : [];
  const loop = [...items, ...items];
  return (
    <section className="overflow-hidden py-16 md:py-24" style={{ background: "var(--c-surface)" }}>
      {(content?.eyebrow || content?.title) && (
        <div className="mx-auto mb-10 max-w-5xl px-5 text-center">
          {content?.eyebrow && <Eyebrow>{content.eyebrow}</Eyebrow>}
          {content?.title && <h2 className="mt-3 text-[2rem] md:text-[2.8rem]" style={{ fontFamily: "var(--font-heading)", color: "var(--c-ink)", letterSpacing: "-1.2px", lineHeight: 1.1 }}>{content.title}</h2>}
        </div>
      )}
      <style>{`
        @keyframes sg-imq { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .sg-imq-track { animation: sg-imq 40s linear infinite; }
        .sg-imq-wrap:hover .sg-imq-track { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) { .sg-imq-track { animation: none; } }
      `}</style>
      <div className="sg-imq-wrap relative w-full overflow-hidden">
        <div className="sg-imq-track flex w-max">
          {loop.map((it, i) => (
            <div key={i} className="group relative mx-3 h-80 w-56 shrink-0 overflow-hidden rounded-[var(--r-card)] transition-transform duration-300 hover:scale-95">
              <img src={it.image} alt="" loading="lazy" className="h-full w-full object-cover" />
              {it.title && (
                <div className="absolute inset-0 flex items-center justify-center px-4 opacity-0 backdrop-blur-md transition-opacity duration-300 group-hover:opacity-100" style={{ background: "color-mix(in srgb, var(--c-ink) 30%, transparent)" }}>
                  <p className="text-center text-lg font-semibold text-white">{it.title}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
