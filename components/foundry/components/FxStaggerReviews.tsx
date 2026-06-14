"use client";
// components/foundry/components/FxStaggerReviews.tsx
// Portage foundry de « Frise de témoignages » (stagger-testimonials) : cartes
// carrées à coin coupé étalées depuis le centre, la centrale en couleur
// d'accent, surélevée et ombrée « hard ». Clic sur une carte ou chevrons pour
// faire défiler (le « wrap » saute sans transition, comme l'original).
import { useEffect, useRef, useState } from "react";
import type { Skin } from "@/lib/foundry/types";

interface StaggerReview {
  quote: string;
  by: string;
}

interface FxStaggerReviewsContent {
  items: StaggerReview[];
}

export default function FxStaggerReviews({ content }: { content: FxStaggerReviewsContent; skin: Skin }) {
  const items = (content.items ?? []).filter((it) => it?.quote).slice(0, 8);
  const n = items.length;
  // order[k] = index de la carte posée au cran k (rotation de liste).
  const [order, setOrder] = useState<number[]>(() => items.map((_, i) => i));
  const prevPos = useRef<Record<number, number>>({});
  const [size, setSize] = useState(410);
  const noTransition = useRef<Set<number>>(new Set());

  useEffect(() => {
    const onResize = () => setSize(window.matchMedia("(min-width:640px)").matches ? 410 : 300);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  useEffect(() => { setOrder(items.map((_, i) => i)); }, [n]); // eslint-disable-line react-hooks/exhaustive-deps

  if (n < 3) return null;

  // Position du cran k autour du centre. floor(n/2) garde le fan symétrique
  // (impair = autant de cartes de chaque côté). Pour un nombre PAIR, il reste
  // une carte excédentaire : on la repère (`backOf`) pour la ranger derrière la
  // centrale plutôt que de la laisser dépasser d'un seul côté.
  const posOf = (k: number) => k - Math.floor(n / 2);
  const backOf = (position: number) => n % 2 === 0 && position === -(n / 2);

  function move(steps: number) {
    if (!steps) return;
    setOrder((o) => {
      const next = [...o];
      if (steps > 0) for (let i = 0; i < steps; i++) next.push(next.shift()!);
      else for (let j = 0; j > steps; j--) next.unshift(next.pop()!);
      return next;
    });
  }

  return (
    <section
      className="relative h-[600px] w-full overflow-hidden"
      style={{ background: "color-mix(in srgb, var(--c-ink) 6%, var(--c-surface))" }}
      aria-label="Témoignages"
    >
      {order.map((idx, k) => {
        const position = posOf(k);
        const isCenter = position === 0;
        const back = backOf(position); // carte excédentaire (n pair) : cachée derrière le centre
        const prev = prevPos.current[idx];
        const wrapped = prev !== undefined && Math.abs(prev - position) > n / 2;
        prevPos.current[idx] = position;
        if (wrapped) noTransition.current.add(idx); else noTransition.current.delete(idx);
        const it = items[idx];
        return (
          <div
            key={idx}
            role="button"
            tabIndex={0}
            onClick={() => move(position)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); move(position); } }}
            className="absolute left-1/2 top-1/2 cursor-pointer p-8"
            style={{
              width: size,
              height: size,
              zIndex: back ? 0 : isCenter ? 10 : 5 - Math.min(4, Math.abs(position)),
              opacity: back ? 0 : 1,
              border: `2px solid ${isCenter ? "var(--c-accent)" : "color-mix(in srgb, var(--c-ink) 18%, transparent)"}`,
              background: isCenter ? "var(--c-accent)" : "var(--c-card)",
              color: isCenter ? "var(--c-on-accent)" : "var(--c-ink)",
              boxShadow: isCenter ? "0 8px 0 4px color-mix(in srgb, var(--c-ink) 18%, transparent)" : "none",
              transition: wrapped ? "none" : "all .5s ease-in-out",
              willChange: "transform",
              clipPath: "polygon(50px 0%, calc(100% - 50px) 0%, 100% 50px, 100% 100%, calc(100% - 50px) 100%, 50px 100%, 0 100%, 0 0)",
              transform: back
                ? "translate(-50%,-50%) translateY(20px) scale(.9)"
                : `translate(-50%,-50%) translateX(${((size / 1.5) * position).toFixed(1)}px) translateY(${isCenter ? -65 : position % 2 ? 15 : -15}px) rotate(${isCenter ? 0 : position % 2 ? 2.5 : -2.5}deg)`,
            }}
          >
            {/* Trait diagonal du coin coupé */}
            <span
              className="absolute right-[-2px] top-[48px] block h-[2px] w-[70.71px] origin-top-right rotate-45"
              style={{ background: "color-mix(in srgb, var(--c-ink) 18%, transparent)" }}
            />
            {/* Avatar initiale (généré, comme l'original) */}
            <span
              className="mb-4 grid h-14 w-12 place-items-center text-xl font-bold"
              style={{
                background: isCenter ? "rgba(255,255,255,.2)" : "color-mix(in srgb, var(--c-accent) 16%, transparent)",
                color: isCenter ? "var(--c-on-accent)" : "var(--c-accent)",
                boxShadow: "3px 3px 0 color-mix(in srgb, var(--c-ink) 14%, transparent)",
              }}
            >
              {(it.by.trim()[0] ?? "•").toUpperCase()}
            </span>
            <h3 className="m-0 text-[1.05rem] font-medium leading-[1.45] sm:text-[1.18rem]">«&nbsp;{it.quote}&nbsp;»</h3>
            <p className="absolute bottom-8 left-8 right-8 m-0 text-sm italic opacity-80">— {it.by}</p>
          </div>
        );
      })}
      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        <StgArrow dir={-1} onClick={() => move(-1)} label="Témoignage précédent" />
        <StgArrow dir={1} onClick={() => move(1)} label="Témoignage suivant" />
      </div>
      <style>{`.sg-fx-stg-btn:hover{background:var(--c-accent)!important;color:var(--c-on-accent)!important;border-color:var(--c-accent)!important}`}</style>
    </section>
  );
}

function StgArrow({ dir, onClick, label }: { dir: number; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="sg-fx-stg-btn flex h-14 w-14 items-center justify-center transition-colors"
      style={{ background: "var(--c-card)", border: "2px solid color-mix(in srgb, var(--c-ink) 18%, transparent)", color: "var(--c-ink)" }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[1.6rem] w-[1.6rem]" aria-hidden>
        {dir < 0 ? <path d="m15 18-6-6 6-6" /> : <path d="m9 18 6-6-6-6" />}
      </svg>
    </button>
  );
}
