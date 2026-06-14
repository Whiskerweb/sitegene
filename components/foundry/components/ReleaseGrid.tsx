"use client";
// components/foundry/components/ReleaseGrid.tsx
// LOT « music-a » — DISCOGRAPHIE : libellé encadré centré + grille de pochettes
// carrées (N&B → couleur au survol, voile « cta » qui se révèle) avec titre +
// année dessous. MODULABLE : 2 à N sorties (grille responsive). CSS vars only.
import type { Skin } from "@/lib/foundry/types";

interface Release { title: string; year?: string; cover: string; href?: string; cta?: string }

export default function ReleaseGrid({ content }: { content: any; skin: Skin }) {
  const items: Release[] = Array.isArray(content?.items) ? content.items : [];
  return (
    <section className="px-5 py-20 md:py-28" style={{ background: "var(--c-surface)" }}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 flex items-end justify-between gap-6">
          {content?.label && (
            <h2
              className="px-4 py-2 text-3xl uppercase sm:text-5xl"
              style={{ border: "2px solid var(--c-ink)", fontFamily: "var(--font-heading)", color: "var(--c-ink)", fontWeight: 800, lineHeight: 1 }}
            >
              {content.label}
            </h2>
          )}
          {content?.more && (
            <a href={content?.moreHref || "#"} className="text-[12px] font-medium uppercase tracking-[0.18em] transition-colors hover:opacity-70" style={{ color: "var(--c-accent)", fontFamily: "var(--font-label, var(--font-body))" }}>
              {content.more}
            </a>
          )}
        </div>

        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {items.map((r, i) => (
            <a key={i} href={r.href || "#"} className="group block">
              <div className="relative aspect-square overflow-hidden" style={{ border: "1px solid color-mix(in srgb, var(--c-ink) 16%, transparent)" }}>
                <img
                  src={r.cover}
                  alt={r.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-[filter,transform] duration-500 group-hover:scale-105"
                  style={{ filter: "grayscale(1)" }}
                  onMouseEnter={(e) => { (e.currentTarget.style.filter = "grayscale(0)"); }}
                  onMouseLeave={(e) => { (e.currentTarget.style.filter = "grayscale(1)"); }}
                />
                <div
                  className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ background: "color-mix(in srgb, var(--c-ink) 55%, transparent)" }}
                >
                  <span className="text-[12px] font-medium uppercase tracking-[0.18em]" style={{ color: "var(--c-accent)", fontFamily: "var(--font-label, var(--font-body))" }}>
                    {r.cta || "Listen"}
                  </span>
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between gap-3">
                <h3 className="text-lg uppercase sm:text-xl" style={{ fontFamily: "var(--font-heading)", color: "var(--c-ink)", fontWeight: 700, lineHeight: 1.05 }}>
                  {r.title}
                </h3>
                {r.year && <span className="flex-shrink-0 text-[12px]" style={{ color: "var(--c-muted)", fontFamily: "var(--font-label, var(--font-body))" }}>{r.year}</span>}
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
