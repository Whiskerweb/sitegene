// components/foundry/components/MarqueeHero.tsx
// Import adapté (style 21st.dev « animated-marquee-hero ») : hero plein écran —
// tagline en pilule, grand titre qui se révèle MOT À MOT, description, CTA accent,
// et un MARQUEE D'IMAGES incliné en bas (masqué en dégradé) qui défile en boucle.
// Réécrit en CSS pur (pas de framer-motion) + CSS vars : rendable serveur,
// pilotable par toutes les DA. prefers-reduced-motion respecté.
import type { Skin } from "@/lib/foundry/types";

interface MarqueeHeroContent {
  tagline: string;
  title: string;
  description: string;
  cta: string;
  images: string[];
}

export default function MarqueeHero({ content }: { content: MarqueeHeroContent; skin: Skin }) {
  const images = Array.isArray(content?.images) && content.images.length ? content.images : [];
  const loop = [...images, ...images];
  const words = (content?.title ?? "").split(/\s+/).filter(Boolean);
  return (
    <section className="relative flex min-h-[88vh] w-full flex-col items-center justify-center overflow-hidden px-4 text-center" style={{ background: "var(--c-surface)" }}>
      <style>{`
        @keyframes sg-mh-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        @keyframes sg-mh-marquee { to { transform: translateX(-50%); } }
        .sg-mh-word { display: inline-block; opacity: 0; animation: sg-mh-rise .6s cubic-bezier(.22,1,.36,1) forwards; }
        .sg-mh-fade { opacity: 0; animation: sg-mh-rise .7s ease forwards; }
        .sg-mh-track { animation: sg-mh-marquee 40s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .sg-mh-word, .sg-mh-fade { animation: none; opacity: 1; }
          .sg-mh-track { animation: none; }
        }
      `}</style>

      <div className="z-10 flex flex-col items-center">
        <div
          className="sg-mh-fade mb-4 inline-block rounded-[var(--r-pill)] border px-4 py-1.5 text-sm font-medium backdrop-blur-sm"
          style={{ borderColor: "color-mix(in srgb, var(--c-ink) 12%, transparent)", background: "color-mix(in srgb, var(--c-card) 55%, transparent)", color: "var(--c-muted)" }}
        >
          {content?.tagline ?? "Rejoignez la communauté"}
        </div>

        <h1 className="max-w-3xl text-5xl font-bold tracking-tight md:text-7xl" style={{ color: "var(--c-ink)", fontFamily: "var(--font-heading)", lineHeight: 1.05 }}>
          {words.length
            ? words.map((w, i) => (
                <span key={i} className="sg-mh-word" style={{ animationDelay: `${i * 80}ms` }}>{w}&nbsp;</span>
              ))
            : "Votre titre ici"}
        </h1>

        <p className="sg-mh-fade mt-6 max-w-xl text-lg" style={{ color: "var(--c-muted)", animationDelay: "500ms" }}>
          {content?.description ?? ""}
        </p>

        <a
          href="#contact"
          className="sg-mh-fade mt-8 rounded-[var(--r-pill)] px-8 py-3 font-semibold text-white shadow-lg transition-transform hover:scale-[1.05]"
          style={{ background: "var(--c-accent)", animationDelay: "600ms" }}
        >
          {content?.cta ?? "Commencer"}
        </a>
      </div>

      {/* Marquee d'images en bas, fondu en dégradé haut/bas */}
      {images.length > 0 && (
        <div
          className="pointer-events-none absolute bottom-0 left-0 h-1/3 w-full md:h-2/5"
          style={{
            WebkitMaskImage: "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
            maskImage: "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
          }}
        >
          <div className="sg-mh-track flex w-max gap-4">
            {loop.map((src, i) => (
              <div key={i} className="aspect-[3/4] h-48 flex-shrink-0 md:h-64" style={{ transform: `rotate(${i % 2 === 0 ? -2 : 5}deg)` }}>
                <img src={src} alt="" loading="lazy" className="h-full w-full rounded-2xl object-cover shadow-md" />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
