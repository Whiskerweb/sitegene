"use client";
// components/foundry/components/HeroDrop.tsx
// LOT « music-a » — HERO « drop » : image plein cadre (N&B) + voile sombre,
// badge encadré (eyebrow), titre CONDENSÉ XXL en capitales, et barre de liens
// d'écoute pleine largeur en bas (Apple / Spotify / YouTube…). MODULABLE :
// 1 à N plateformes (la barre se répartit en colonnes). CSS vars only.
import type { Skin } from "@/lib/foundry/types";

interface Platform { label: string; href?: string }

export default function HeroDrop({ content }: { content: any; skin: Skin }) {
  const platforms: Platform[] = Array.isArray(content?.platforms) ? content.platforms : [];
  return (
    <section className="relative flex min-h-[88vh] flex-col overflow-hidden" style={{ background: "var(--c-panel)" }}>
      {content?.image && (
        <img
          src={content.image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: "grayscale(1)", opacity: 0.55 }}
        />
      )}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to bottom, color-mix(in srgb, var(--c-panel) 70%, transparent) 0%, color-mix(in srgb, var(--c-panel) 35%, transparent) 45%, var(--c-panel) 100%)" }}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-5 py-24 text-center">
        {content?.eyebrow && (
          <span
            className="mb-7 inline-block px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.22em]"
            style={{ border: "1px solid color-mix(in srgb, var(--c-on-panel) 45%, transparent)", color: "var(--c-on-panel)", fontFamily: "var(--font-label, var(--font-body))" }}
          >
            {content.eyebrow}
          </span>
        )}
        {content?.title && (
          <h1
            className="max-w-5xl text-[15vw] uppercase sm:text-[12vw] md:text-[9rem]"
            style={{ fontFamily: "var(--font-heading)", color: "var(--c-on-panel)", fontWeight: 800, lineHeight: 0.88, letterSpacing: "-0.01em" }}
          >
            {content.title}
          </h1>
        )}
      </div>

      {platforms.length > 0 && (
        <div
          className="relative z-10 grid w-full"
          style={{ gridTemplateColumns: `repeat(${Math.min(platforms.length, 3)}, minmax(0, 1fr))`, borderTop: "1px solid color-mix(in srgb, var(--c-on-panel) 18%, transparent)" }}
        >
          {platforms.map((p, i) => (
            <a
              key={i}
              href={p.href || "#"}
              className="group flex items-center justify-center gap-2 px-5 py-6 text-[12px] font-medium uppercase tracking-[0.18em] transition-colors"
              style={{
                color: "var(--c-on-panel)",
                fontFamily: "var(--font-label, var(--font-body))",
                borderLeft: i === 0 ? "none" : "1px solid color-mix(in srgb, var(--c-on-panel) 18%, transparent)",
              }}
            >
              <span
                aria-hidden
                className="inline-block h-1.5 w-1.5 rounded-full transition-transform group-hover:scale-150"
                style={{ background: "var(--c-accent)" }}
              />
              {p.label}
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
