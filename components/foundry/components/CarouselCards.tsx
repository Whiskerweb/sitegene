"use client";
// components/foundry/components/CarouselCards.tsx
// Import adapté (style « carousel-card ») : carrousel d'images avec, au survol,
// un volet de texte qui remonte. Flèches de navigation. Réécrit en scroll-snap
// natif (robuste, responsive, modulable N cartes) — pas de transform fragile.
// CSS vars ; scrims neutres tolérés.
import { useRef } from "react";
import type { Skin } from "@/lib/foundry/types";
import { Eyebrow } from "../primitives";

interface Item { image: string; content: string }

export default function CarouselCards({ content }: { content: any; skin: Skin }) {
  const items: Item[] = Array.isArray(content?.items) ? content.items : [];
  const trackRef = useRef<HTMLDivElement>(null);
  const scrollBy = (dir: number) => {
    const el = trackRef.current; if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.7), behavior: "smooth" });
  };
  const Arrow = ({ dir, label }: { dir: number; label: string }) => (
    <button
      type="button" aria-label={label} onClick={() => scrollBy(dir)}
      className="absolute top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full text-white transition hover:brightness-110"
      style={{ background: "color-mix(in srgb, var(--c-ink) 55%, transparent)", [dir < 0 ? "left" : "right"]: 8 } as React.CSSProperties}
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d={dir < 0 ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} />
      </svg>
    </button>
  );

  return (
    <section className="px-5 py-16 md:py-24" style={{ background: "var(--c-surface)" }}>
      <div className="mx-auto max-w-6xl">
        {(content?.eyebrow || content?.title) && (
          <div className="mb-8">
            {content?.eyebrow && <Eyebrow>{content.eyebrow}</Eyebrow>}
            {content?.title && <h2 className="mt-3 text-[2rem] md:text-[2.8rem]" style={{ fontFamily: "var(--font-heading)", color: "var(--c-ink)", letterSpacing: "-1.2px", lineHeight: 1.1 }}>{content.title}</h2>}
          </div>
        )}
        <div className="relative">
          {items.length > 1 && <Arrow dir={-1} label="Précédent" />}
          {items.length > 1 && <Arrow dir={1} label="Suivant" />}
          <div ref={trackRef} className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {items.map((c, i) => (
              <div key={i} className="group relative h-64 shrink-0 basis-[85%] snap-start overflow-hidden rounded-[var(--r-card)] shadow-md sm:basis-[46%] lg:basis-[31%]">
                <img src={c.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                <div className="absolute inset-0 translate-y-full overflow-y-auto p-4 text-white transition-transform duration-300 group-hover:translate-y-0" style={{ background: "color-mix(in srgb, var(--c-ink) 82%, transparent)" }}>
                  <p className="text-sm leading-relaxed">{c.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
