"use client";
// components/foundry/components/ArtistStatement.tsx
// LOT « music-a » — MANIFESTE / À PROPOS : portrait (N&B) à gauche + grande
// citation en capitales à droite, suivie d'une rangée de « pastilles » de
// plateformes d'écoute. MODULABLE : 0 à N plateformes. CSS vars only.
import type { Skin } from "@/lib/foundry/types";

interface Platform { label: string; href?: string }

export default function ArtistStatement({ content }: { content: any; skin: Skin }) {
  const platforms: Platform[] = Array.isArray(content?.platforms) ? content.platforms : [];
  return (
    <section className="px-5 py-20 md:py-28" style={{ background: "var(--c-surface)" }}>
      <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
        {content?.image && (
          <div className="relative aspect-[4/5] overflow-hidden" style={{ border: "1px solid color-mix(in srgb, var(--c-ink) 16%, transparent)" }}>
            <img src={content.image} alt="" loading="lazy" className="h-full w-full object-cover" style={{ filter: "grayscale(1)" }} />
          </div>
        )}
        <div>
          {content?.label && (
            <p className="mb-6 text-[12px] font-medium uppercase tracking-[0.22em]" style={{ color: "var(--c-accent)", fontFamily: "var(--font-label, var(--font-body))" }}>{content.label}</p>
          )}
          {content?.quote && (
            <blockquote className="text-2xl uppercase sm:text-3xl md:text-[2.6rem]" style={{ fontFamily: "var(--font-heading)", color: "var(--c-ink)", fontWeight: 700, lineHeight: 1.12 }}>
              {content.quote}
            </blockquote>
          )}
          {platforms.length > 0 && (
            <>
              {content?.listenLabel && (
                <p className="mb-4 mt-10 text-[12px] font-medium uppercase tracking-[0.22em]" style={{ color: "var(--c-muted)", fontFamily: "var(--font-label, var(--font-body))" }}>{content.listenLabel}</p>
              )}
              <div className="flex flex-wrap gap-3">
                {platforms.map((p, i) => (
                  <a
                    key={i}
                    href={p.href || "#"}
                    className="px-5 py-2 text-[12px] font-medium uppercase tracking-[0.18em] transition-colors"
                    style={{ border: "1px solid color-mix(in srgb, var(--c-ink) 20%, transparent)", borderRadius: "var(--r-pill)", color: "var(--c-ink)", fontFamily: "var(--font-label, var(--font-body))" }}
                  >
                    {p.label}
                  </a>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
