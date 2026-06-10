// (Plumber Emergency / RAPIDPLOMB) Hero blueprint : fond accent quadrillé, swoosh
// accent2 décoratif en SVG, titre XL, CTA jaune arrondi + disponibilité ;
// photo droite avec carte flottante client au bas.
import type { CSSProperties } from "react";
import type { Skin } from "@/lib/foundry/types";

export default function PlumberEmergencyHero({ content, skin }: { content: any; skin: Skin }) {
  const root: CSSProperties = {};
  if (skin.accent) root["--c-accent" as keyof CSSProperties] = skin.accent as never;
  return (
    <section className="pehero relative overflow-hidden px-6 pb-20 pt-12" style={root}>
      <style>{`
        .pehero {
          background-color: var(--c-accent);
          background-image:
            linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px);
          background-size: 64px 64px;
        }
        .pehero-in { opacity: 0; animation: pehero-rise .9s cubic-bezier(.22,.61,.36,1) forwards; }
        .pehero-in2 { opacity: 0; animation: pehero-rise .9s cubic-bezier(.22,.61,.36,1) .15s forwards; }
        @keyframes pehero-rise { from { opacity: 0; transform: translateY(40px) } to { opacity: 1; transform: none } }
        @media (prefers-reduced-motion: reduce) { .pehero-in, .pehero-in2 { animation: none; opacity: 1 } }
      `}</style>

      {/* Décoration swoosh accent2 */}
      <div className="pointer-events-none absolute right-0 top-0 h-full w-2/3" aria-hidden>
        <svg viewBox="0 0 600 600" className="h-full w-full opacity-40" preserveAspectRatio="none">
          <path d="M600 0 C 400 120, 520 320, 600 420 L 600 0 Z" fill="var(--c-accent2)" />
        </svg>
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 md:grid-cols-2">
        {/* Gauche */}
        <div className="pehero-in">
          <h1 className="mb-6 text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl" style={{ fontFamily: "var(--font-heading)" }}>
            {content?.title ?? "Tous vos travaux de plomberie, partout chez vous."}
          </h1>
          <p className="mb-8 max-w-md text-lg text-white/80">
            {content?.tagline ?? "Qu'il s'agisse d'un robinet qui fuit ou d'une urgence majeure, nos professionnels ne sont qu'à un appel de chez vous."}
          </p>
          <a href="#contact" className="inline-flex items-center gap-3 rounded-[var(--r-card)] px-7 py-4 text-sm font-bold shadow-lg transition-all hover:brightness-105" style={{ background: "var(--c-accent2)", color: "var(--c-ink)" }}>
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
            <span>{content?.cta ?? "Appeler : 01 86 95 99 43"}</span>
          </a>
          <p className="mt-4 text-xs text-white/70">{content?.availability ?? "Disponible 24/7, appelez à tout moment"}</p>
        </div>

        {/* Droite : photo + carte flottante */}
        <div className="pehero-in2 relative">
          <div className="overflow-hidden rounded-[var(--r-xl)] shadow-2xl">
            <img
              src={content?.image ?? "/_templates/plumber-emergency/img/hero.jpg"}
              alt=""
              className="h-[420px] w-full object-cover"
            />
          </div>
          {/* Carte flottante client */}
          <div className="absolute bottom-6 left-6 flex items-center gap-3 rounded-[var(--r-card)] bg-white px-5 py-3 shadow-xl">
            <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-gray-100">
              <img
                src={content?.customerAvatar ?? "/_templates/plumber-emergency/img/av2.jpg"}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <div className="text-sm font-bold" style={{ color: "var(--c-ink)" }}>{content?.customerName ?? "Christin Williams"}</div>
              <div className="text-xs" style={{ color: "var(--c-muted)" }}>{content?.customerRole ?? "Cliente satisfaite"}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
