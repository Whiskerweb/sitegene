// components/foundry/components/TestimonialsMarquee.tsx
// Import adapté (style « marquee testimonials ») : deux rangées d'avis qui
// défilent en sens opposés (pause au survol). Carte = photo + nom + texte +
// étoiles. SANS l'habillage Twitter (pas de @pseudo ni badge vérifié) — comme
// demandé. CSS pur + étoiles inline. Modulable.
import type { Skin } from "@/lib/foundry/types";
import { Eyebrow } from "../primitives";

interface Review { name: string; role?: string; avatar?: string; content: string; rating?: number }

function Stars({ n = 5 }: { n?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 24 24" className="h-4 w-4" fill={i < n ? "var(--c-accent2)" : "color-mix(in srgb, var(--c-ink) 15%, transparent)"}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
        </svg>
      ))}
    </div>
  );
}

function Row({ data, reverse }: { data: Review[]; reverse?: boolean }) {
  const loop = [...data, ...data];
  return (
    <div className="sg-tmq-wrap relative w-full overflow-hidden">
      <div className={`sg-tmq-track flex w-max gap-4 py-2 ${reverse ? "sg-tmq-rev" : ""}`}>
        {loop.map((r, i) => (
          <div key={i} className="flex w-80 shrink-0 flex-col rounded-[var(--r-card)] p-6" style={{ background: "var(--c-card)", boxShadow: "0 8px 28px color-mix(in srgb, var(--c-ink) 8%, transparent)" }}>
            <div className="mb-3 flex items-center gap-3">
              {r.avatar && <img src={r.avatar} alt={r.name} className="h-10 w-10 rounded-full object-cover" />}
              <div>
                <p className="font-semibold" style={{ color: "var(--c-ink)" }}>{r.name}</p>
                {r.role && <p className="text-sm" style={{ color: "var(--c-muted)" }}>{r.role}</p>}
              </div>
            </div>
            <p className="mb-3 text-sm leading-relaxed" style={{ color: "color-mix(in srgb, var(--c-ink) 78%, transparent)" }}>{r.content}</p>
            <Stars n={r.rating ?? 5} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TestimonialsMarquee({ content }: { content: any; skin: Skin }) {
  const items: Review[] = Array.isArray(content?.items) ? content.items : [];
  const half = Math.ceil(items.length / 2) || 1;
  const row1 = items.slice(0, half);
  const row2 = items.slice(half).length ? items.slice(half) : items;
  return (
    <section className="overflow-hidden py-16 md:py-24" style={{ background: "var(--c-surface)" }}>
      <style>{`
        @keyframes sg-tmq { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .sg-tmq-track { animation: sg-tmq 38s linear infinite; }
        .sg-tmq-rev { animation-direction: reverse; }
        .sg-tmq-wrap:hover .sg-tmq-track { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) { .sg-tmq-track { animation: none; } }
      `}</style>
      {(content?.eyebrow || content?.title) && (
        <div className="mx-auto mb-10 max-w-5xl px-5 text-center">
          {content?.eyebrow && <Eyebrow>{content.eyebrow}</Eyebrow>}
          {content?.title && <h2 className="mt-3 text-[2rem] md:text-[2.8rem]" style={{ fontFamily: "var(--font-heading)", color: "var(--c-ink)", letterSpacing: "-1.2px", lineHeight: 1.1 }}>{content.title}</h2>}
        </div>
      )}
      <div className="flex flex-col gap-4">
        <Row data={row1} />
        <Row data={row2} reverse />
      </div>
    </section>
  );
}
