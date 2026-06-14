// components/foundry/components/BoldStackHero.tsx
// Import adapté (style « SocialFi / #CLUB ») : hero MAXIMALISTE — trois mots
// géants empilés en typo grasse à OMBRE PORTÉE 3D, sur le fond de page quadrillé ;
// un seul CTA = badge circulaire rotatif sous le titre ; deux cartes de profil
// flottantes dans les gouttières (desktop). Tout en CSS → rendable serveur.
//
// SÉMANTIQUE DES COULEURS (rôles stricts, cf. docs/DA-TOKENS.md) :
//   fond = --c-surface · textes = --c-ink · UN mot en highlight = --c-accent
//   bouton = --c-accent + texte --c-on-accent · décor (cartes) = teintes d'--c-ink.
// On n'utilise PAS --c-accent2 ici (réservé aux petites touches), pour éviter que
// changer « Accent 2 » ne repeigne titres/boutons.
import type { CSSProperties } from "react";
import type { Skin } from "@/lib/foundry/types";

interface Card { name: string; meta: string; avatar: string }
interface BoldStackContent {
  titleA: string;
  titleB: string;
  titleC: string;
  cta: string;
  ctaHref?: string;
  cards: Card[];
}

export default function BoldStackHero({ content, skin }: { content: BoldStackContent; skin: Skin }) {
  const root: CSSProperties = { background: "var(--c-surface)" };
  if (skin.accent) root["--c-accent" as keyof CSSProperties] = skin.accent as never;
  const cards = Array.isArray(content?.cards) ? content.cards.slice(0, 2) : [];

  return (
    <section className="relative flex min-h-[88vh] w-full items-center justify-center overflow-hidden px-6 py-24" style={root}>
      <style>{`
        /* Quadrillage + ombre portée dérivés du TEXTE (s'adaptent clair/sombre). */
        .bsh-grid { background-image: linear-gradient(to right, color-mix(in srgb, var(--c-ink) 7%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--c-ink) 7%, transparent) 1px, transparent 1px); background-size: 4rem 4rem; }
        .bsh-word { --sh: color-mix(in srgb, var(--c-ink) 22%, var(--c-surface)); font-family: var(--font-heading), "Arial Black", Impact, sans-serif; font-weight: 900; line-height: .92; letter-spacing: -.03em; text-transform: uppercase; overflow-wrap: anywhere; text-shadow: 1px 1px 0 var(--sh),2px 2px 0 var(--sh),3px 3px 0 var(--sh),4px 4px 0 var(--sh),5px 5px 0 var(--sh),6px 6px 0 var(--sh); }
        @keyframes sg-bsh-float { 0%,100% { transform: translateY(0) rotate(var(--r)); } 50% { transform: translateY(-14px) rotate(var(--r)); } }
        @keyframes sg-bsh-spin { to { transform: rotate(360deg); } }
        .bsh-card { animation: sg-bsh-float 6s ease-in-out infinite; }
        .bsh-badge-ring { animation: sg-bsh-spin 11s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .bsh-card, .bsh-badge-ring { animation: none; } }
      `}</style>

      <div className="bsh-grid pointer-events-none absolute inset-0 z-0" aria-hidden />

      <div className="relative z-10 mx-auto flex w-full max-w-[1200px] flex-col items-center">
        {/* Titre géant : textes en --c-ink, le mot du milieu en --c-accent (highlight). */}
        <div className="flex max-w-4xl flex-col items-center gap-1.5 text-center">
          <h1 className="bsh-word m-0 text-[clamp(2.25rem,6.5vw,4.5rem)]" style={{ color: "var(--c-ink)" }}>{content?.titleA ?? "Osez"}</h1>
          <h1 className="bsh-word m-0 text-[clamp(2.75rem,8.5vw,6rem)]" style={{ color: "var(--c-accent)" }}>{content?.titleB ?? "Voir"}</h1>
          <h1 className="bsh-word m-0 text-[clamp(2.25rem,6.5vw,4.5rem)]" style={{ color: "var(--c-ink)" }}>{content?.titleC ?? "Grand"}</h1>
        </div>

        {/* CTA unique : badge rotatif — fond accent, texte/flèche on-accent (contraste garanti). */}
        <a href={content?.ctaHref || "#contact"} className="relative mt-12 flex h-28 w-28 rotate-6 items-center justify-center rounded-full shadow-xl transition-transform hover:scale-105 md:h-32 md:w-32" style={{ background: "var(--c-accent)" }}>
          <div className="bsh-badge-ring absolute inset-1">
            <svg viewBox="0 0 100 100" className="h-full w-full">
              <path id="bsh-cp" d="M 50,50 m -36,0 a 36,36 0 1,1 72,0 a 36,36 0 1,1 -72,0" fill="none" />
              <text className="text-[10px] font-black uppercase" style={{ letterSpacing: "0.16em" }} fill="var(--c-on-accent)">
                <textPath href="#bsh-cp" startOffset="0%">{`${content?.cta ?? "Commencer"} • ${content?.cta ?? "Commencer"} • `}</textPath>
              </text>
            </svg>
          </div>
          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="var(--c-on-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </a>

        {/* Cartes de profil flottantes — dans les GOUTTIÈRES (desktop large). */}
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
  // Verre dérivé du TEXTE (--c-ink) → lisible sur fond clair comme sombre.
  return (
    <div
      className="flex aspect-[3/3.4] w-40 flex-col items-center justify-center rounded-[1.75rem] border p-5 shadow-2xl backdrop-blur-md"
      style={{ background: "color-mix(in srgb, var(--c-ink) 8%, transparent)", borderColor: "color-mix(in srgb, var(--c-ink) 16%, transparent)" }}
    >
      <div className="mb-3 h-16 w-16 overflow-hidden rounded-full border-[3px]" style={{ borderColor: "color-mix(in srgb, var(--c-ink) 20%, transparent)" }}>
        <img src={card.avatar} alt="" className="h-full w-full object-cover" />
      </div>
      <p className="text-center text-sm font-bold" style={{ color: "var(--c-ink)" }}>{card.name}</p>
      <p className="mt-1 text-center text-[11px]" style={{ color: "var(--c-muted)" }}>{card.meta}</p>
    </div>
  );
}
