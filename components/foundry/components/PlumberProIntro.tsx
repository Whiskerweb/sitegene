// (Plumber Pro) Section intro/about : eyebrow vertical + titre XXL à gauche,
// photo grande à gauche + texte/stats/CTA à droite. Parallaxe sur la photo.
import type { CSSProperties } from "react";
import type { Skin } from "@/lib/foundry/types";

interface StatItem { value: string; label: string }

export default function PlumberProIntro({ content, skin }: { content: any; skin: Skin }) {
  const root: CSSProperties = {};
  if (skin.accent) root["--c-accent" as keyof CSSProperties] = skin.accent as never;
  const stats: StatItem[] = Array.isArray(content?.stats) ? content.stats : [
    { value: "12+", label: "Années d'expérience" },
    { value: "4+", label: "Certifications" },
    { value: "24/7", label: "Service d'urgence" },
  ];
  return (
    <section className="ppintro bg-[var(--c-surface)] py-20 md:py-28 px-6" style={root}>
      <style>{`
        .ppintro-eyebrow { writing-mode: vertical-rl; transform: rotate(180deg); letter-spacing: 0.15em; }
      `}</style>
      <div className="mx-auto max-w-7xl">
        {/* Titre avec eyebrow vertical */}
        <div className="mb-14 flex gap-5">
          <span className="ppintro-eyebrow flex-shrink-0 text-[11px] font-bold uppercase" style={{ color: "var(--c-accent)" }}>
            {content?.label ?? "Notre introduction"}
          </span>
          <h2 className="max-w-2xl text-3xl font-extrabold leading-tight md:text-5xl" style={{ color: "var(--c-ink)", fontFamily: "var(--font-heading)" }}>
            {content?.title ?? "Une équipe qualifiée à votre service depuis de nombreuses années"}
          </h2>
        </div>

        <div className="grid items-center gap-12 md:grid-cols-2">
          {/* Photo */}
          <div className="overflow-hidden rounded-[var(--r-xl)] shadow-xl">
            <img
              src={content?.image ?? "/_templates/plumber-pro/img/intro.jpg"}
              alt=""
              className="h-[460px] w-full object-cover"
            />
          </div>

          {/* Texte + stats */}
          <div>
            <h3 className="mb-5 text-2xl font-bold leading-snug md:text-3xl" style={{ color: "var(--c-ink)", fontFamily: "var(--font-heading)" }}>
              {content?.sideTitle ?? "La satisfaction client et la qualité sont au cœur de tout ce que nous faisons."}
            </h3>
            <p className="mb-8 text-base leading-relaxed" style={{ color: "var(--c-muted)" }}>
              {content?.sideText ?? "Nos professionnels qualifiés s'engagent à fournir des solutions haut de gamme avec un service irréprochable."}
            </p>

            {/* Stats 3 colonnes */}
            {stats.length > 0 && (
              <div
                className="mb-8 grid gap-6 border-t pt-8"
                style={{
                  gridTemplateColumns: `repeat(${Math.min(stats.length, 3)}, 1fr)`,
                  borderColor: "color-mix(in srgb, var(--c-ink) 8%, transparent)",
                }}
              >
                {stats.map((s, i) => (
                  <div key={i}>
                    <div className="mb-1 text-3xl font-extrabold" style={{ color: "var(--c-accent)", fontFamily: "var(--font-heading)" }}>{s.value}</div>
                    <div className="text-xs" style={{ color: "var(--c-muted)" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            <a href="#contact" className="inline-flex items-center gap-2 rounded-[var(--r-pill)] px-6 py-3 text-sm font-semibold text-white transition-all hover:brightness-110" style={{ background: "var(--c-accent)" }}>
              {content?.cta ?? "En savoir plus"}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
