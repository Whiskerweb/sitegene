// components/foundry/components/PlumberProHero.tsx
// Extraction (Plumber Pro / Aqualis — sites/artisans/plumber-pro/index.html) :
// hero plein écran sombre — photo en fond (opacité 60 %) + voile dégradé encre,
// eyebrow en pilule contour, titre XL, CTA + compteur d'avis. Parallaxe du fond
// au scroll (scroll-driven CSS, équivalent du scrub GSAP source) + entrée fondu-montée.
import type { CSSProperties } from "react";
import type { Skin } from "@/lib/foundry/types";

export default function PlumberProHero({ content, skin }: { content: any; skin: Skin }) {
  const root: CSSProperties = { minHeight: 560, background: "var(--c-ink)" };
  if (skin.accent) root["--c-accent" as keyof CSSProperties] = skin.accent as never;
  return (
    <section className="relative overflow-hidden" style={root}>
      <style>{`
        .pphero-in { opacity: 0; animation: pphero-rise .9s cubic-bezier(.22,.61,.36,1) forwards; }
        @keyframes pphero-rise { from { opacity: 0; transform: translateY(40px) } to { opacity: 1; transform: none } }
        @supports (animation-timeline: view()) {
          .pphero-bg { animation: pphero-par linear both; animation-timeline: view(); animation-range: cover 0% cover 100%; }
          @keyframes pphero-par { from { transform: translateY(0) } to { transform: translateY(-12%) } }
        }
        @media (prefers-reduced-motion: reduce) { .pphero-in, .pphero-bg { animation: none; opacity: 1 } }
      `}</style>

      {/* Fond photo + voile dégradé (parallaxe au scroll) */}
      <div className="pphero-bg absolute" style={{ inset: "0 0 -14% 0" }} aria-hidden>
        <img src={content?.image ?? "/_templates/plumber-pro/img/hero.jpg"} alt="" className="h-full w-full object-cover opacity-60" />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(90deg, var(--c-ink) 0%, color-mix(in srgb, var(--c-ink) 80%, transparent) 50%, color-mix(in srgb, var(--c-ink) 20%, transparent) 100%)" }}
        />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
        <div className="pphero-in">
          <span className="mb-6 inline-block rounded-[var(--r-pill)] border border-white/25 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/80">
            {content?.eyebrow ?? "Spécialistes plomberie certifiés"}
          </span>
          <h1 className="mb-6 text-4xl font-extrabold leading-[1.05] text-white md:text-5xl lg:text-6xl" style={{ fontFamily: "var(--font-heading)" }}>
            {content?.title ?? "Des services de plomberie sur lesquels vous pouvez compter"}
          </h1>
          <p className="mb-8 max-w-md text-lg text-white/70">
            {content?.tagline ?? "Une plomberie fiable, abordable et disponible 24/7 pour tous vos besoins, à la maison comme en entreprise."}
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <a href="#contact" className="inline-flex items-center gap-2 rounded-[var(--r-pill)] px-6 py-3.5 text-sm font-semibold transition-all hover:brightness-105" style={{ background: "var(--c-accent2)", color: "var(--c-ink)" }}>
              {content?.cta ?? "Prendre rendez-vous"}
            </a>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-extrabold text-white" style={{ fontFamily: "var(--font-heading)" }}>{content?.reviews ?? "8K+"}</span>
              <span className="text-sm text-white/60">{content?.reviewsLabel ?? "Avis clients"}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
