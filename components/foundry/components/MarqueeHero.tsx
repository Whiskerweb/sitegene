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
    <section className="relative w-full overflow-hidden" style={{ background: "var(--c-surface)" }}>
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

      {/* Contenu : hauteur NATURELLE, posé en haut (pas d'étirement flex-1 qui
          créait un vide énorme avant les images). */}
      <div className="z-10 flex flex-col items-center px-4 pt-20 text-center md:pt-28">
        <div
          className="sg-mh-fade mb-6 inline-block max-w-2xl truncate rounded-[var(--r-pill)] border px-4 py-1.5 text-sm font-medium backdrop-blur-sm"
          style={{ borderColor: "color-mix(in srgb, var(--c-ink) 12%, transparent)", background: "color-mix(in srgb, var(--c-card) 55%, transparent)", color: "var(--c-muted)" }}
        >
          {content?.tagline ?? "Rejoignez la communauté"}
        </div>

        <h1 className="max-w-4xl text-5xl font-extrabold tracking-[-0.02em] md:text-7xl" style={{ color: "var(--c-ink)", fontFamily: "var(--font-heading)", lineHeight: 1.0 }}>
          {words.length
            ? words.map((w, i) => (
                <span key={i} className="sg-mh-word" style={{ animationDelay: `${i * 70}ms` }}>{w}&nbsp;</span>
              ))
            : "Votre titre ici"}
        </h1>

        <p className="sg-mh-fade mt-6 max-w-xl text-lg" style={{ color: "var(--c-muted)", animationDelay: "450ms" }}>
          {content?.description ?? ""}
        </p>

        <a
          href="#contact"
          className="sg-mh-fade mt-8 rounded-[var(--r-pill)] px-8 py-3 font-semibold text-white shadow-lg transition-transform hover:scale-[1.05]"
          style={{ background: "var(--c-accent)", animationDelay: "550ms" }}
        >
          {content?.cta ?? "Commencer"}
        </a>
      </div>

      {/* Marquee d'images : écart CONTRÔLÉ sous le CTA (mt-14, rythme 8pt),
          jamais étiré ; fondu en dégradé sur le haut pour se mêler au contenu. */}
      {images.length > 0 && (
        <div
          className="pointer-events-none mt-14 w-full pb-2"
          style={{
            WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 30%, black 100%)",
            maskImage: "linear-gradient(to bottom, transparent 0%, black 30%, black 100%)",
          }}
        >
          <div className="sg-mh-track flex w-max gap-4 px-2 pt-4">
            {loop.map((src, i) => (
              <div key={i} className="aspect-[3/4] h-48 flex-shrink-0 md:h-60" style={{ transform: `rotate(${i % 2 === 0 ? -2 : 5}deg)` }}>
                <img src={src} alt="" loading="lazy" className="h-full w-full rounded-2xl object-cover shadow-md" />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
