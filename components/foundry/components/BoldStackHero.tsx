// components/foundry/components/BoldStackHero.tsx
// Import adapté (style « SocialFi / #CLUB ») : hero MAXIMALISTE — trois mots
// géants empilés en typo grasse à OMBRE PORTÉE 3D, sur un aplat de couleur
// (accent) quadrillé ; un seul CTA = badge circulaire rotatif sous le titre ;
// deux cartes de profil flottantes dans les gouttières (desktop), à l'écart du
// texte. Hauteur pleine + centrage : le contenu ne déborde/coupe jamais. Tout
// en CSS (float + spin) → rendable serveur. Piloté par CSS vars.
import type { CSSProperties } from "react";
import type { Skin } from "@/lib/foundry/types";

interface Card { name: string; meta: string; avatar: string }
interface BoldStackContent {
  titleA: string;
  titleB: string;
  titleC: string;
  cta: string;
  cards: Card[];
}

export default function BoldStackHero({ content, skin }: { content: BoldStackContent; skin: Skin }) {
  const root: CSSProperties = {
    background: "var(--c-accent)",
    ["--sg-bsh-sh" as keyof CSSProperties]: "color-mix(in srgb, var(--c-accent) 42%, #000)" as never,
  };
  if (skin.accent) root["--c-accent" as keyof CSSProperties] = skin.accent as never;
  const cards = Array.isArray(content?.cards) ? content.cards.slice(0, 2) : [];

  return (
    <section className="relative flex min-h-[88vh] w-full items-center justify-center overflow-hidden px-6 py-24" style={root}>
      <style>{`
        .bsh-grid { background-image: linear-gradient(to right, #ffffff14 1px, transparent 1px), linear-gradient(to bottom, #ffffff14 1px, transparent 1px); background-size: 4rem 4rem; }
        .bsh-word { font-family: "Arial Black", Impact, var(--font-heading), sans-serif; font-weight: 900; line-height: .92; letter-spacing: -.03em; text-transform: uppercase; overflow-wrap: anywhere; text-shadow: 1px 1px 0 var(--sg-bsh-sh),2px 2px 0 var(--sg-bsh-sh),3px 3px 0 var(--sg-bsh-sh),4px 4px 0 var(--sg-bsh-sh),5px 5px 0 var(--sg-bsh-sh),6px 6px 0 var(--sg-bsh-sh); }
        @keyframes sg-bsh-float { 0%,100% { transform: translateY(0) rotate(var(--r)); } 50% { transform: translateY(-14px) rotate(var(--r)); } }
        @keyframes sg-bsh-spin { to { transform: rotate(360deg); } }
        .bsh-card { animation: sg-bsh-float 6s ease-in-out infinite; }
        .bsh-badge-ring { animation: sg-bsh-spin 11s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .bsh-card, .bsh-badge-ring { animation: none; } }
      `}</style>

      {/* Quadrillage de fond */}
      <div className="bsh-grid pointer-events-none absolute inset-0 z-0" aria-hidden />

      <div className="relative z-10 mx-auto flex w-full max-w-[1200px] flex-col items-center">
        {/* Titre géant empilé, CENTRÉ et plafonné (ne déborde jamais) */}
        <div className="flex max-w-4xl flex-col items-center gap-1.5 text-center">
          <h1 className="bsh-word m-0 text-[clamp(2.25rem,6.5vw,4.5rem)]" style={{ color: "var(--c-accent2)" }}>{content?.titleA ?? "Osez"}</h1>
          <h1 className="bsh-word m-0 text-[clamp(2.75rem,8.5vw,6rem)] text-white">{content?.titleB ?? "Voir"}</h1>
          <h1 className="bsh-word m-0 text-[clamp(2.25rem,6.5vw,4.5rem)] text-white">{content?.titleC ?? "Grand"}</h1>
        </div>

        {/* CTA unique : badge circulaire rotatif, centré sous le titre */}
        <a href="#contact" className="relative mt-12 flex h-28 w-28 rotate-6 items-center justify-center rounded-full shadow-xl transition-transform hover:scale-105 md:h-32 md:w-32" style={{ background: "var(--c-accent2)" }}>
          <div className="bsh-badge-ring absolute inset-1">
            <svg viewBox="0 0 100 100" className="h-full w-full">
              <path id="bsh-cp" d="M 50,50 m -36,0 a 36,36 0 1,1 72,0 a 36,36 0 1,1 -72,0" fill="none" />
              <text className="text-[10px] font-black uppercase" style={{ letterSpacing: "0.16em" }} fill="var(--c-ink)">
                <textPath href="#bsh-cp" startOffset="0%">{`${content?.cta ?? "Commencer"} • ${content?.cta ?? "Commencer"} • `}</textPath>
              </text>
            </svg>
          </div>
          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="var(--c-ink)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </a>

        {/* Cartes de profil flottantes — dans les GOUTTIÈRES, à l'écart du texte (desktop large) */}
        {cards.length > 0 && (
          <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden>
            {cards[0] && (
              <div className="bsh-card absolute left-0 top-[14%]" style={{ ["--r" as keyof CSSProperties]: "-10deg" as never }}>
                <ProfileCard card={cards[0]} />
              </div>
            )}
            {cards[1] && (
              <div className="bsh-card absolute bottom-[12%] right-0" style={{ ["--r" as keyof CSSProperties]: "10deg" as never, animationDelay: "1.2s" }}>
                <ProfileCard card={cards[1]} />
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function ProfileCard({ card }: { card: Card }) {
  return (
    <div className="flex aspect-[3/3.4] w-40 flex-col items-center justify-center rounded-[1.75rem] border border-white/40 bg-white/20 p-5 shadow-2xl backdrop-blur-md">
      <div className="mb-3 h-16 w-16 overflow-hidden rounded-full border-[3px] border-white/50">
        <img src={card.avatar} alt="" className="h-full w-full object-cover" />
      </div>
      <p className="text-center text-sm font-bold text-white">{card.name}</p>
      <p className="mt-1 text-center text-[11px] text-white/80">{card.meta}</p>
    </div>
  );
}
