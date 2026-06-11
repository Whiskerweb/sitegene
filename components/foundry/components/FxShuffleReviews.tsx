"use client";
// components/foundry/components/FxShuffleReviews.tsx
// Portage foundry de « Témoignages à mélanger » (shuffle-testimonials) : pile
// de 3 cartes en éventail (rotate -6/0/6°, décalées 33 %/66 %). On attrape la
// carte de devant et on la jette vers la gauche (> 150 px) pour la passer
// derrière. Drag élastique en Pointer Events, retour animé en CSS.
import { useRef, useState } from "react";
import type { Skin } from "@/lib/foundry/types";

interface ShuffleReview {
  quote: string;
  author: string;
}

interface FxShuffleReviewsContent {
  eyebrow: string;
  title: string;
  items: ShuffleReview[];
}

const POS = [
  { z: 2, t: "translateX(0%) rotate(-6deg)" },
  { z: 1, t: "translateX(33%) rotate(0deg)" },
  { z: 0, t: "translateX(66%) rotate(6deg)" },
];

export default function FxShuffleReviews({ content }: { content: FxShuffleReviewsContent; skin: Skin }) {
  const items = (content.items ?? []).filter((it) => it?.quote).slice(0, 3);
  const [order, setOrder] = useState<number[]>(() => items.map((_, i) => i));
  const [drag, setDrag] = useState<{ x0: number; y0: number; dx: number; dy: number } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  if (items.length < 2) return null;

  const shuffle = () => setOrder((o) => [...o.slice(1), o[0]]);

  return (
    <section className="grid place-content-center overflow-hidden px-8 py-20" style={{ background: "var(--c-ink)", minHeight: "34rem" }}>
      <div className="mb-12 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--c-accent)" }}>{content.eyebrow}</p>
        <h2 className="mx-auto mt-3 max-w-xl text-[1.9rem] text-white md:text-[2.4rem]" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-1px", lineHeight: 1.1 }}>
          {content.title}
        </h2>
        <p className="mt-2 text-sm text-white/40">Attrapez la carte et jetez-la vers la gauche</p>
      </div>
      <div ref={stageRef} className="relative ml-[-64px] h-[400px] w-[272px] sm:ml-[-100px] sm:h-[450px] sm:w-[350px] md:ml-[-175px]">
        {order.map((idx, pos) => {
          const it = items[idx];
          const front = pos === 0;
          const p = POS[Math.min(pos, POS.length - 1)];
          const dragging = front && drag;
          return (
            <figure
              key={idx}
              onPointerDown={(e) => {
                if (!front) return;
                (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
                setDrag({ x0: e.clientX, y0: e.clientY, dx: 0, dy: 0 });
                e.preventDefault();
              }}
              onPointerMove={(e) => { if (drag && front) setDrag({ ...drag, dx: e.clientX - drag.x0, dy: e.clientY - drag.y0 }); }}
              onPointerUp={() => { if (drag && front) { if (drag.dx < -150) shuffle(); setDrag(null); } }}
              onPointerCancel={() => setDrag(null)}
              className="absolute left-0 top-0 m-0 grid h-full w-full select-none place-content-center gap-6 rounded-2xl p-6"
              style={{
                zIndex: p.z,
                border: "2px solid rgba(255,255,255,.16)",
                background: "rgba(255,255,255,.06)",
                backdropFilter: "blur(12px)",
                boxShadow: "0 20px 25px -5px rgba(0,0,0,.25), 0 8px 10px -6px rgba(0,0,0,.25)",
                cursor: front ? (dragging ? "grabbing" : "grab") : "default",
                touchAction: front ? "none" : undefined,
                transition: dragging ? "none" : "transform .35s ease",
                willChange: "transform",
                transform: dragging
                  ? `translate(${(drag!.dx * 0.6).toFixed(1)}px, ${(drag!.dy * 0.35).toFixed(1)}px) rotate(${(-6 + drag!.dx * 0.03).toFixed(2)}deg)`
                  : p.t,
              }}
            >
              <span
                className="pointer-events-none mx-auto grid h-28 w-28 place-items-center rounded-full text-4xl font-bold sm:h-32 sm:w-32"
                style={{ border: "2px solid rgba(255,255,255,.16)", background: "color-mix(in srgb, var(--c-accent) 30%, transparent)", color: "var(--c-on-accent)" }}
              >
                {(it.author.trim()[0] ?? "•").toUpperCase()}
              </span>
              <blockquote className="m-0 text-center text-[1.08rem] italic" style={{ color: "rgba(255,255,255,.78)" }}>«&nbsp;{it.quote}&nbsp;»</blockquote>
              <figcaption className="text-center text-sm font-medium not-italic" style={{ color: "var(--c-surface)" }}>{it.author}</figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}
