"use client";
// components/foundry/components/FxCircularReviews.tsx
// Portage foundry de l'effet « Témoignages carrousel 3D » (circular-testimonials) :
// 3 portraits empilés en perspective (centre net, voisins inclinés rotateY ±15°
// et surélevés), citation révélée MOT À MOT (blur→net, 25 ms/mot), autoplay 5 s,
// flèches + clavier. Couleurs/typos pilotées par la charte.
import { useCallback, useEffect, useRef, useState } from "react";
import type { Skin } from "@/lib/foundry/types";
import { Eyebrow } from "../primitives";

interface CircularReview {
  quote: string;
  name: string;
  role: string;
  avatar: string;
}

interface FxCircularReviewsContent {
  eyebrow: string;
  title: string;
  items: CircularReview[];
}

export default function FxCircularReviews({ content }: { content: FxCircularReviewsContent; skin: Skin }) {
  const items = (content.items ?? []).filter((it) => it?.quote);
  const n = items.length;
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);
  const wrapRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLElement>(null);
  // Re-render des spans à chaque changement (l'animation mot à mot rejoue).
  const [tick, setTick] = useState(0);
  // Décalage des portraits voisins : réduit sur mobile (sinon ils débordent).
  const [g, setG] = useState(56);
  useEffect(() => {
    const apply = () => setG(window.innerWidth < 768 ? 34 : 56);
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  const go = useCallback(
    (dir: number, manual = false) => {
      if (manual) setAuto(false);
      setActive((a) => (a + dir + n) % n);
      setTick((t) => t + 1);
    },
    [n],
  );

  useEffect(() => {
    if (!auto || n < 2) return;
    const t = setInterval(() => go(1), 5000);
    return () => clearInterval(t);
  }, [auto, n, go]);

  // Flèches clavier quand la section est à l'écran.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = rootRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      if (e.key === "ArrowLeft") go(-1, true);
      if (e.key === "ArrowRight") go(1, true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  if (n === 0) return null;
  const it = items[active];

  // Disposition 3D : centre net, gauche/droite inclinés et surélevés.
  const styleFor = (i: number): React.CSSProperties => {
    const isActive = i === active;
    const isLeft = (active - 1 + n) % n === i;
    const isRight = (active + 1) % n === i;
    const base: React.CSSProperties = {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover",
      borderRadius: "var(--r-xl)",
      boxShadow: "0 10px 30px rgba(0,0,0,.2)",
      transition: "all .8s cubic-bezier(.4,2,.3,1)",
      willChange: "transform, opacity",
      opacity: 0,
      pointerEvents: "none",
    };
    if (isActive) return { ...base, zIndex: 3, opacity: 1, transform: "translateX(0) translateY(0) scale(1) rotateY(0)" };
    if (isLeft) return { ...base, zIndex: 2, opacity: 1, transform: `translateX(-${g}px) translateY(-${g * 0.8}px) scale(.85) rotateY(15deg)` };
    if (isRight) return { ...base, zIndex: 2, opacity: 1, transform: `translateX(${g}px) translateY(-${g * 0.8}px) scale(.85) rotateY(-15deg)` };
    return { ...base, zIndex: 1 };
  };

  return (
    <section ref={rootRef} className="px-5 py-16 md:py-24" style={{ background: "var(--c-surface)", overflowX: "clip" }}>
      <div className="mx-auto max-w-[1100px]">
        <div className="text-center">
          <Eyebrow>{content.eyebrow}</Eyebrow>
          <h2 className="mx-auto mt-4 max-w-xl text-[2rem] md:text-[2.6rem]" style={{ fontFamily: "var(--font-heading)", color: "var(--c-ink)", letterSpacing: "-1.2px", lineHeight: 1.1 }}>
            {content.title}
          </h2>
        </div>
        <div className="mt-12 grid items-center gap-12 md:grid-cols-2 md:gap-20">
          <div ref={wrapRef} className="relative mx-auto h-[15rem] w-full max-w-[17rem] sm:h-[17rem] sm:max-w-[19rem] md:h-[20rem] md:max-w-[21rem]" style={{ perspective: 1000 }}>
            {items.map((m, i) => (
              <img key={`${m.name}-${i}`} src={m.avatar} alt={m.name} draggable={false} style={styleFor(i)} />
            ))}
          </div>
          <div className="flex flex-col justify-between gap-6">
            <div key={tick}>
              <h3 className="text-[1.75rem] font-bold" style={{ color: "var(--c-ink)", fontFamily: "var(--font-heading)", animation: "sgFxCtFade .3s ease-in-out" }}>{it.name}</h3>
              <p className="mb-5 mt-1 text-base" style={{ color: "color-mix(in srgb, var(--c-ink) 60%, transparent)", animation: "sgFxCtFade .3s ease-in-out" }}>{it.role}</p>
              <p className="text-[1.15rem] leading-[1.75]" style={{ color: "var(--c-ink)" }}>
                {it.quote.split(" ").map((w, i) => (
                  <span
                    key={i}
                    className="inline-block"
                    style={{ opacity: 0, transform: "translateY(5px)", filter: "blur(10px)", animation: `sgFxCtWord .22s ease-in-out forwards`, animationDelay: `${(0.025 * i).toFixed(3)}s` }}
                  >
                    {w}&nbsp;
                  </span>
                ))}
              </p>
            </div>
            <div className="flex gap-5">
              <CtArrow dir={-1} onClick={() => go(-1, true)} label="Témoignage précédent" />
              <CtArrow dir={1} onClick={() => go(1, true)} label="Témoignage suivant" />
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes sgFxCtWord { to { opacity: 1; transform: none; filter: blur(0); } }
        @keyframes sgFxCtFade { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
        .sg-fx-ct-arrow:hover { background: var(--c-accent) !important; }
        @media (prefers-reduced-motion: reduce) { .sg-fx-ct-word { animation: none; } }
      `}</style>
    </section>
  );
}

function CtArrow({ dir, onClick, label }: { dir: number; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="sg-fx-ct-arrow grid h-11 w-11 place-items-center rounded-full transition-colors"
      style={{ background: "var(--c-panel)", color: "var(--c-on-panel)" }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="h-[1.45rem] w-[1.45rem]" aria-hidden>
        {dir < 0 ? <><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></> : <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>}
      </svg>
    </button>
  );
}
