"use client";
// components/foundry/components/TourDates.tsx
// LOT « music-a » — DATES / TOURNÉE : image de fond estompée, gros titre/hashtag,
// puis tableau Date / Ville / Salle avec un lien « explorer » par ligne, qui
// s'accentue au survol. MODULABLE : 1 à N dates. CSS vars only.
import type { Skin } from "@/lib/foundry/types";

interface DateRow { date: string; city: string; venue?: string; href?: string }

export default function TourDates({ content }: { content: any; skin: Skin }) {
  const items: DateRow[] = Array.isArray(content?.items) ? content.items : [];
  const cols = content?.columns || {};
  const cta: string = content?.cta || "Learn More";
  return (
    <section className="relative overflow-hidden" style={{ background: "var(--c-panel)" }}>
      {content?.image && (
        <img src={content.image} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ filter: "grayscale(1)", opacity: 0.18 }} />
      )}
      <div className="absolute inset-0" style={{ background: "color-mix(in srgb, var(--c-panel) 72%, transparent)" }} />

      <div className="relative z-10 mx-auto max-w-6xl px-5 py-20 md:py-28">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          {content?.tag && (
            <h2 className="text-5xl uppercase sm:text-7xl md:text-8xl" style={{ fontFamily: "var(--font-heading)", color: "var(--c-on-panel)", fontWeight: 800, lineHeight: 0.9 }}>
              {content.tag}
            </h2>
          )}
          {content?.more && (
            <a href={content?.moreHref || "#"} className="text-[12px] font-medium uppercase tracking-[0.18em] transition-colors hover:opacity-70" style={{ color: "var(--c-accent)", fontFamily: "var(--font-label, var(--font-body))" }}>
              {content.more}
            </a>
          )}
        </div>

        {(cols.date || cols.city || cols.venue) && (
          <div
            className="hidden gap-4 pb-4 text-[11px] uppercase tracking-[0.18em] md:grid"
            style={{ gridTemplateColumns: "120px 1fr 1.4fr 140px", color: "var(--c-muted)", borderBottom: "1px solid color-mix(in srgb, var(--c-on-panel) 18%, transparent)", fontFamily: "var(--font-label, var(--font-body))" }}
          >
            <span>{cols.date || "Date"}</span>
            <span>{cols.city || "City"}</span>
            <span>{cols.venue || "Venue"}</span>
            <span className="text-right">{cols.explore || "Explore"}</span>
          </div>
        )}

        <ul>
          {items.map((d, i) => (
            <li
              key={i}
              className="grid grid-cols-1 items-center gap-1 py-6 md:grid-cols-[120px_1fr_1.4fr_140px] md:gap-4"
              style={{ borderBottom: "1px solid color-mix(in srgb, var(--c-on-panel) 14%, transparent)" }}
            >
              <span className="text-2xl" style={{ fontFamily: "var(--font-heading)", color: "var(--c-on-panel)", fontWeight: 700, lineHeight: 1 }}>{d.date}</span>
              <span style={{ color: "var(--c-on-panel)", fontFamily: "var(--font-body)" }}>{d.city}</span>
              {d.venue && <span style={{ color: "var(--c-muted)", fontFamily: "var(--font-body)" }}>{d.venue}</span>}
              <a
                href={d.href || "#"}
                className="text-[12px] font-medium uppercase tracking-[0.18em] transition-colors hover:opacity-70 md:text-right"
                style={{ color: "var(--c-accent)", fontFamily: "var(--font-label, var(--font-body))" }}
              >
                {cta}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
