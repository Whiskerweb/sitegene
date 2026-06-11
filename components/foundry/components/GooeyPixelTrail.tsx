"use client";
// components/foundry/components/GooeyPixelTrail.tsx
// Import adapté (effet « gooey pixel trail », style 21st.dev / danielpetho) :
// une grande phrase posée sur une image assombrie ; une TRAÎNÉE DE PIXELS suit
// le curseur et se fond en blobs organiques via un filtre SVG « gooey ».
//
// Fondu FIABLE : chaque cellule touchée (re)joue une animation CSS qui va
// toujours jusqu'à opacity 0 (animation:none + reflow + replay) — fini les
// carrés qui restaient allumés. On traite CHAQUE pointermove (pas de frame
// jetée). rAF/transition manuelle abandonnés. prefers-reduced-motion respecté.
import { useEffect, useId, useRef, useState } from "react";
import type { Skin } from "@/lib/foundry/types";

interface GooeyContent {
  eyebrow: string;
  text: string;
  description: string;
  cta: string;
  image: string;
}

const FADE_MS = 900;

export default function GooeyPixelTrail({ content }: { content: GooeyContent; skin: Skin }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cellsRef = useRef<Array<HTMLSpanElement | null>>([]);
  const [grid, setGrid] = useState<{ cols: number; rows: number }>({ cols: 0, rows: 0 });
  const filterId = "sg-goo-" + useId().replace(/[^a-zA-Z0-9]/g, "");

  // Grille calée sur la taille réelle de la section (recalculée au resize).
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const compute = () => {
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      const cell = w < 768 ? 26 : 34;
      setGrid({ cols: Math.max(1, Math.floor(w / cell)), rows: Math.max(1, Math.floor(h / cell)) });
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Traînée : la cellule sous le curseur (re)joue un fondu qui finit TOUJOURS à 0.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || !grid.cols || !grid.rows) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const c = Math.floor(((e.clientX - r.left) / r.width) * grid.cols);
      const row = Math.floor(((e.clientY - r.top) / r.height) * grid.rows);
      if (c < 0 || row < 0 || c >= grid.cols || row >= grid.rows) return;
      const span = cellsRef.current[row * grid.cols + c];
      if (!span) return;
      // Réinitialise puis relance l'animation → fondu garanti, même re-déclenché.
      span.style.animation = "none";
      void span.offsetWidth; // force reflow
      span.style.animation = `sg-goopx-fade ${FADE_MS}ms ease-out forwards`;
    };
    el.addEventListener("pointermove", onMove, { passive: true });
    return () => el.removeEventListener("pointermove", onMove);
  }, [grid]);

  const total = grid.cols * grid.rows;

  return (
    <section
      ref={wrapRef}
      className="relative flex min-h-[80vh] w-full items-center justify-center overflow-hidden px-6 text-center"
      style={{ background: "var(--c-ink)" }}
    >
      <style>{`@keyframes sg-goopx-fade { 0% { opacity: 1; } 100% { opacity: 0; } }`}</style>

      {/* Filtre gooey : fond les cellules voisines allumées en blobs organiques. */}
      <svg className="absolute h-0 w-0" aria-hidden>
        <defs>
          <filter id={filterId}>
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* Image de fond assombrie */}
      {content?.image && <img src={content.image} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ opacity: 0.55 }} />}
      <div className="absolute inset-0" style={{ background: "color-mix(in srgb, var(--c-ink) 45%, transparent)" }} />

      {/* Couche de pixels (curseur) — fondue par le filtre gooey */}
      <div
        className="absolute inset-0 z-[1] grid"
        style={{
          filter: `url(#${filterId})`,
          gridTemplateColumns: `repeat(${grid.cols || 1}, 1fr)`,
          gridTemplateRows: `repeat(${grid.rows || 1}, 1fr)`,
        }}
        aria-hidden
      >
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            ref={(n) => { cellsRef.current[i] = n; }}
            style={{ background: "var(--c-surface)", opacity: 0 }}
          />
        ))}
      </div>

      {/* Phrase manifeste + description + bouton */}
      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center">
        {content?.eyebrow && (
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--c-accent2)" }}>{content.eyebrow}</p>
        )}
        <p className="text-4xl font-bold leading-[1.05] md:text-6xl" style={{ color: "var(--c-surface)", fontFamily: "var(--font-heading)", letterSpacing: "-1px" }}>
          {content?.text ?? "Donnez vie à vos idées"}
        </p>
        {content?.description && (
          <p className="mt-6 max-w-xl text-base md:text-lg" style={{ color: "color-mix(in srgb, var(--c-surface) 75%, transparent)", lineHeight: 1.6 }}>
            {content.description}
          </p>
        )}
        {content?.cta && (
          <a
            href="#contact"
            className="mt-8 inline-block rounded-[var(--r-pill)] px-8 py-3.5 font-semibold text-white shadow-lg transition-transform hover:scale-[1.05]"
            style={{ background: "var(--c-accent)" }}
          >
            {content.cta}
          </a>
        )}
      </div>
    </section>
  );
}
