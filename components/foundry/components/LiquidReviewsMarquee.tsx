// components/foundry/components/LiquidReviewsMarquee.tsx
// Import adapté (style « marquee + liquid glass ») : avis en défilement, cartes
// « verre liquide » (filtre SVG turbulence/déplacement + ombres internes). Pause
// au survol. CSS vars + SVG filter inline. Modulable. Effet premium.
import type { Skin } from "@/lib/foundry/types";
import { useId } from "react";
import { Eyebrow } from "../primitives";

interface Review { name: string; role?: string; avatar?: string; content: string; rating?: number }

const GLASS_SHADOW =
  "0 0 6px rgba(0,0,0,0.04), 0 2px 6px rgba(0,0,0,0.08), inset 3px 3px 0.5px -3px rgba(255,255,255,0.4), inset -3px -3px 0.5px -3px rgba(255,255,255,0.3), inset 0 0 6px 6px rgba(255,255,255,0.06), 0 0 12px rgba(0,0,0,0.08)";

export default function LiquidReviewsMarquee({ content }: { content: any; skin: Skin }) {
  const items: Review[] = Array.isArray(content?.items) ? content.items : [];
  const loop = [...items, ...items];
  const fid = "sg-liquid-" + useId().replace(/[^a-zA-Z0-9]/g, "");

  return (
    <section className="overflow-hidden py-16 md:py-24" style={{ background: "var(--c-card)" }}>
      <style>{`
        @keyframes sg-liq { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .sg-liq-track { animation: sg-liq 42s linear infinite; }
        .sg-liq-wrap:hover .sg-liq-track { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) { .sg-liq-track { animation: none; } }
      `}</style>

      {/* Filtre verre liquide */}
      <svg className="hidden">
        <defs>
          <filter id={fid} x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.02 0.02" numOctaves={1} seed={1} result="t" />
            <feGaussianBlur in="t" stdDeviation="2" result="bn" />
            <feDisplacementMap in="SourceGraphic" in2="bn" scale={60} xChannelSelector="R" yChannelSelector="B" />
          </filter>
        </defs>
      </svg>

      {(content?.eyebrow || content?.title) && (
        <div className="mx-auto mb-10 max-w-5xl px-5 text-center">
          {content?.eyebrow && <Eyebrow>{content.eyebrow}</Eyebrow>}
          {content?.title && <h2 className="mt-3 text-[2rem] md:text-[2.8rem]" style={{ fontFamily: "var(--font-heading)", color: "var(--c-ink)", letterSpacing: "-1.2px", lineHeight: 1.1 }}>{content.title}</h2>}
        </div>
      )}

      <div className="sg-liq-wrap relative w-full overflow-hidden">
        <div className="sg-liq-track flex w-max gap-3 px-2 py-2">
          {loop.map((r, i) => (
            <div key={i} className="w-80 shrink-0 rounded-3xl border p-6" style={{ borderColor: "color-mix(in srgb, var(--c-ink) 10%, transparent)", background: "color-mix(in srgb, var(--c-surface) 60%, transparent)", boxShadow: GLASS_SHADOW, backdropFilter: `url(#${fid})` }}>
              <div className="mb-4 flex items-center gap-3">
                {r.avatar && <img src={r.avatar} alt={r.name} className="h-10 w-10 rounded-full object-cover" />}
                <div>
                  <p className="font-semibold" style={{ color: "var(--c-ink)" }}>{r.name}</p>
                  {r.role && <p className="text-sm" style={{ color: "color-mix(in srgb, var(--c-ink) 55%, transparent)" }}>{r.role}</p>}
                </div>
              </div>
              <p className="mb-3 text-sm leading-relaxed" style={{ color: "color-mix(in srgb, var(--c-ink) 80%, transparent)" }}>{r.content}</p>
              <div className="flex gap-1">
                {Array.from({ length: r.rating ?? 5 }).map((_, k) => (
                  <svg key={k} viewBox="0 0 24 24" className="h-4 w-4" fill="var(--c-accent2)"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" /></svg>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
