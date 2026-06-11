// components/foundry/components/BoldStackHero.tsx
// Import adapté (style « SocialFi / #CLUB ») : hero MAXIMALISTE — trois mots
// géants empilés et décalés, en typo grasse avec OMBRE PORTÉE 3D, sur un aplat
// de couleur (accent) quadrillé ; cartes de profil flottantes en verre, flèches
// dessinées et badge circulaire rotatif (CTA). Audacieux, communauté/jeunesse.
// Tout en CSS (float + spin) → rendable serveur. Piloté par CSS vars.
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
    // Couleur de l'ombre portée 3D = teinte plus sombre de l'accent.
    ["--sg-bsh-sh" as keyof CSSProperties]: "color-mix(in srgb, var(--c-accent) 45%, #000)" as never,
  };
  if (skin.accent) root["--c-accent" as keyof CSSProperties] = skin.accent as never;
  const cards = Array.isArray(content?.cards) ? content.cards.slice(0, 2) : [];

  return (
    <section className="relative w-full overflow-hidden" style={root}>
      <style>{`
        .bsh-grid { background-image: linear-gradient(to right, #ffffff18 1px, transparent 1px), linear-gradient(to bottom, #ffffff18 1px, transparent 1px); background-size: 4rem 4rem; }
        .bsh-word { font-family: "Arial Black", Impact, var(--font-heading), sans-serif; font-weight: 900; line-height: .85; letter-spacing: -.04em; text-transform: uppercase; text-shadow: 1px 1px 0 var(--sg-bsh-sh),2px 2px 0 var(--sg-bsh-sh),3px 3px 0 var(--sg-bsh-sh),4px 4px 0 var(--sg-bsh-sh),5px 5px 0 var(--sg-bsh-sh),6px 6px 0 var(--sg-bsh-sh),7px 7px 0 var(--sg-bsh-sh),8px 8px 0 var(--sg-bsh-sh),9px 9px 0 var(--sg-bsh-sh),10px 10px 0 var(--sg-bsh-sh); }
        @keyframes sg-bsh-float { 0%,100% { transform: translateY(0) rotate(var(--r)); } 50% { transform: translateY(-16px) rotate(var(--r)); } }
        @keyframes sg-bsh-spin { to { transform: rotate(360deg); } }
        .bsh-card { animation: sg-bsh-float 6s ease-in-out infinite; }
        .bsh-badge-ring { animation: sg-bsh-spin 11s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .bsh-card, .bsh-badge-ring { animation: none; } }
      `}</style>

      {/* Quadrillage de fond */}
      <div className="bsh-grid pointer-events-none absolute inset-0 z-0" aria-hidden />

      <div className="relative z-10 mx-auto w-full max-w-[1280px] px-4 py-[12vh] md:py-[14vh]">
        {/* Typo géante empilée + décalée */}
        <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center text-center">
          <div className="flex w-full justify-start pl-[8%] md:pl-[22%]">
            <h1 className="bsh-word m-0 text-[clamp(3.2rem,11vw,150px)]" style={{ color: "var(--c-accent2)" }}>{content?.titleA ?? "Osez"}</h1>
          </div>
          <div className="flex w-full justify-center">
            <h1 className="bsh-word m-0 text-[clamp(3.6rem,14vw,200px)] text-white">{content?.titleB ?? "Voir"}</h1>
          </div>
          <div className="flex w-full justify-start pl-[14%] md:pl-[28%]">
            <h1 className="bsh-word m-0 text-[clamp(3.2rem,11vw,150px)] text-white">{content?.titleC ?? "Grand"}</h1>
          </div>

          {/* Cartes de profil flottantes (desktop) */}
          <div className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden>
            {cards[0] && (
              <div className="bsh-card absolute bottom-[6%] left-[2%]" style={{ ["--r" as keyof CSSProperties]: "-12deg" as never }}>
                <ProfileCard card={cards[0]} />
              </div>
            )}
            {cards[1] && (
              <div className="bsh-card absolute right-[2%] top-[8%]" style={{ ["--r" as keyof CSSProperties]: "12deg" as never, animationDelay: "1.2s" }}>
                <ProfileCard card={cards[1]} />
              </div>
            )}
          </div>

          {/* Flèches dessinées (accent2) */}
          <svg className="absolute -left-2 bottom-0 hidden h-24 w-24 overflow-visible md:block" viewBox="0 0 100 100" fill="none" stroke="var(--c-accent2)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M10,90 C 10,40 40,20 60,50 C 70,65 80,75 95,70" />
            <path d="M80,55 L95,70 L85,85" />
          </svg>
          <svg className="absolute -right-2 top-0 hidden h-24 w-24 overflow-visible md:block" viewBox="0 0 100 100" fill="none" stroke="var(--c-accent2)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M90,10 C 80,60 60,80 40,60 C 20,40 40,20 60,30" />
            <path d="M55,18 L60,30 L48,36" />
          </svg>
        </div>

        {/* Badge circulaire rotatif (CTA) */}
        <div className="mt-10 flex justify-center md:mt-4 md:justify-end md:pr-[12%]">
          <a href="#contact" className="relative flex h-28 w-28 rotate-12 items-center justify-center rounded-full shadow-xl transition-transform hover:scale-105 md:h-32 md:w-32" style={{ background: "var(--c-accent2)" }}>
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
        </div>
      </div>
    </section>
  );
}

function ProfileCard({ card }: { card: Card }) {
  return (
    <div className="flex aspect-[3/3.5] w-40 flex-col items-center justify-center rounded-[2rem] border border-white/40 bg-white/20 p-5 shadow-2xl backdrop-blur-md md:w-48">
      <div className="mb-3 h-16 w-16 overflow-hidden rounded-full border-[3px] border-white/50 md:h-20 md:w-20">
        <img src={card.avatar} alt="" className="h-full w-full object-cover" />
      </div>
      <p className="text-center text-sm font-bold text-white md:text-base">{card.name}</p>
      <p className="mt-1 text-center text-[10px] text-white/80 md:text-xs">{card.meta}</p>
    </div>
  );
}
