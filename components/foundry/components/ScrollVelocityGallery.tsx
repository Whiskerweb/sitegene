"use client";
// components/foundry/components/ScrollVelocityGallery.tsx
// Import adapté (style « scroll-velocity ») : deux rangées d'images qui défilent
// en continu et ACCÉLÈRENT avec la vitesse de défilement de la page (sens opposé).
// Réécrit SANS framer-motion : rAF maison + lecture de la vélocité de scroll en
// capture (marche aussi dans le canvas de l'éditeur). CSS vars. Modulable.
import { useEffect, useRef } from "react";
import type { Skin } from "@/lib/foundry/types";
import { Eyebrow } from "../primitives";

interface Item { image: string; title?: string }
const BASE = 0.04; // %/frame de défilement de fond
const wrap = (v: number) => (v <= -50 ? v + 50 : v >= 0 ? v - 50 : v);

export default function ScrollVelocityGallery({ content }: { content: any; skin: Skin }) {
  const items: Item[] = Array.isArray(content?.items) ? content.items : [];
  const loop = [...items, ...items];
  const aRef = useRef<HTMLDivElement>(null);
  const bRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0, xa = 0, xb = -25, vel = 0, lastY = window.scrollY;
    const onScroll = () => { const y = window.scrollY; vel = Math.max(-3, Math.min(3, y - lastY)); lastY = y; };
    const tick = () => {
      const boost = Math.abs(vel) * 0.25;
      xa = wrap(xa - (BASE + boost));
      xb = wrap(xb + (BASE + boost));
      if (aRef.current) aRef.current.style.transform = `translateX(${xa}%)`;
      if (bRef.current) bRef.current.style.transform = `translateX(${xb}%)`;
      vel *= 0.9;
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    raf = requestAnimationFrame(tick);
    return () => { window.removeEventListener("scroll", onScroll, { capture: true } as never); cancelAnimationFrame(raf); };
  }, []);

  const Row = ({ inner }: { inner: React.RefObject<HTMLDivElement | null> }) => (
    <div className="w-full overflow-hidden">
      <div ref={inner} className="flex w-max gap-4 will-change-transform">
        {loop.map((it, i) => (
          <div key={i} className="h-28 w-44 shrink-0 overflow-hidden rounded-xl md:h-40 md:w-64 xl:h-52 xl:w-80">
            <img src={it.image} alt={it.title ?? ""} loading="lazy" className="h-full w-full object-cover" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <section className="overflow-hidden py-16 md:py-24" style={{ background: "var(--c-surface)" }}>
      {(content?.eyebrow || content?.title) && (
        <div className="mx-auto mb-10 max-w-5xl px-5 text-center">
          {content?.eyebrow && <Eyebrow>{content.eyebrow}</Eyebrow>}
          {content?.title && <h2 className="mt-3 text-[2rem] md:text-[2.8rem]" style={{ fontFamily: "var(--font-heading)", color: "var(--c-ink)", letterSpacing: "-1.2px", lineHeight: 1.1 }}>{content.title}</h2>}
        </div>
      )}
      <div className="flex flex-col gap-4">
        <Row inner={aRef} />
        <Row inner={bRef} />
      </div>
    </section>
  );
}
