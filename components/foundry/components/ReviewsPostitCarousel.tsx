// components/foundry/components/ReviewsPostitCarousel.tsx
import { Eyebrow } from "../primitives";
import type { Skin } from "@/lib/foundry/types";

interface Review { text: string; name: string; role: string; avatar: string }
interface ReviewsContent { eyebrow: string; title: string; items: Review[] }

// Couleurs de pins (rotation par carte) — l'accent ludique « tableau d'épingles ».
const PINS = ["#7da4db", "#e1937d", "#c9543b", "#8e9867"];

function Pin({ color }: { color: string }) {
  return (
    <svg width="32" height="44" viewBox="0 0 32 44" aria-hidden style={{ filter: "drop-shadow(0 4px 4px rgba(13,5,3,.28))" }}>
      <line x1="16" y1="20" x2="16" y2="42" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <ellipse cx="16" cy="13" rx="12" ry="12" fill={color} />
      <ellipse cx="11.5" cy="9" rx="3.6" ry="2.6" fill="rgba(255,255,255,.55)" />
    </svg>
  );
}

export default function ReviewsPostitCarousel({ content }: { content: ReviewsContent; skin: Skin }) {
  const loop = [...content.items, ...content.items];
  return (
    <section id="temoignages" className="relative overflow-hidden py-16 md:py-24" style={{ background: "var(--c-surface)" }}>
      <div className="relative z-10 mx-auto mb-12 max-w-[1280px] px-5 text-center">
        <div className="flex justify-center">
          <Eyebrow>{content.eyebrow}</Eyebrow>
        </div>
        <h2
          className="mx-auto mt-4 max-w-2xl text-[2rem] md:text-[3.2rem]"
          style={{ fontFamily: "var(--font-heading)", color: "var(--c-ink)", letterSpacing: "-1.5px", lineHeight: 1.15 }}
        >
          {content.title}
        </h2>
      </div>

      {/* Pinboard : voile jaune doux derrière la rangée de notes */}
      <div
        className="pointer-events-none absolute inset-x-6 top-1/2 h-[460px] -translate-y-1/2 rounded-[40px]"
        style={{ background: "rgba(243,222,138,0.4)" }}
        aria-hidden
      />

      {/* Marquee de notes épinglées */}
      <div className="relative z-10 overflow-hidden py-8">
        <div className="foundry-marquee flex w-max gap-8 px-4">
          {loop.map((r, i) => {
            const color = PINS[i % PINS.length];
            const tilt = i % 2 === 0 ? "-1.4deg" : "1.4deg";
            return (
              <figure
                key={i}
                className="relative w-[340px] shrink-0 rounded-[var(--r-card)] bg-white p-8 pt-10"
                style={{ transform: `rotate(${tilt})`, boxShadow: "0 24px 50px -28px rgba(13,5,3,.35)" }}
              >
                <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
                  <Pin color={color} />
                </span>
                <blockquote className="text-xl leading-relaxed" style={{ color: "var(--c-ink)" }}>
                  « {r.text} »
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <img src={r.avatar} alt="" className="h-11 w-11 rounded-full object-cover" />
                  <span>
                    <span className="block font-bold" style={{ color: "var(--c-accent2)" }}>{r.name}</span>
                    <span className="text-sm" style={{ color: "var(--c-accent)" }}>{r.role}</span>
                  </span>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}
