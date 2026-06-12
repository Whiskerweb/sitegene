// components/foundry/components/ReviewsPostitCarousel.tsx
import { Eyebrow } from "../primitives";
import type { Skin } from "@/lib/foundry/types";

interface Review { text: string; name: string; role: string; avatar: string }
interface ReviewsContent { eyebrow: string; title: string; items: Review[] }

// Couleurs de pins (rotation par carte) — l'accent ludique « tableau d'épingles ».
const PINS = ["#7da4db", "#e1937d", "#c9543b", "#8e9867"];

// La carte est TOUJOURS du papier blanc : son texte ne doit donc pas suivre
// --c-ink/--c-muted (qui s'inversent en DA sombre → clair-sur-blanc illisible).
// On fixe des tons sombres chauds, lisibles sur blanc dans toutes les chartes.
const NOTE_INK = "#26211c";
const NOTE_MUTED = "#7a7268";

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

      {/* Cadre « tableau d'épingles » : voile jaune doux + bordure douce. Le
          défilement est masqué À CE cadre (overflow-hidden + coins arrondis),
          donc les notes naissent et disparaissent À SES bords — elles ne fuient
          plus jusqu'aux deux côtés du site. */}
      <div
        className="relative z-10 mx-4 overflow-hidden rounded-[40px] md:mx-8"
        style={{ background: "rgba(243,222,138,0.4)", border: "1px solid rgba(13,5,3,.10)" }}
      >
        <div className="foundry-marquee flex w-max gap-8 px-8 py-14">
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
                <blockquote className="text-xl leading-relaxed" style={{ color: NOTE_INK }}>
                  « {r.text} »
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <img src={r.avatar} alt="" className="h-11 w-11 rounded-full object-cover" />
                  <span>
                    <span className="block font-bold" style={{ color: NOTE_INK }}>{r.name}</span>
                    <span className="text-sm" style={{ color: NOTE_MUTED }}>{r.role}</span>
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
