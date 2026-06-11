// components/foundry/components/FxDisplayCards.tsx
// Portage foundry de « Cartes en éventail » (display-cards) : pile de 3 cartes
// inclinées (skewY -8°) empilées en escalier ; les 2 du fond en niveaux de
// gris sous un voile, chaque carte glisse et reprend ses couleurs au survol.
// 100 % CSS. Esthétique sombre signature, posée sur l'encre de la charte.
import type { Skin } from "@/lib/foundry/types";

interface DisplayCard {
  title: string;
  desc: string;
  meta: string;
}

interface FxDisplayCardsContent {
  eyebrow: string;
  title: string;
  items: DisplayCard[];
}

const SPARKLES = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="h-4 w-4">
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
  </svg>
);

export default function FxDisplayCards({ content }: { content: FxDisplayCardsContent; skin: Skin }) {
  const items = (content.items ?? []).slice(0, 3);
  return (
    <section className="overflow-hidden px-5 py-16 md:py-24" style={{ background: "var(--c-ink)" }}>
      <div className="mx-auto max-w-[1100px]">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--c-accent2)" }}>{content.eyebrow}</p>
          <h2 className="mx-auto mt-4 max-w-xl text-[2rem] text-white md:text-[2.6rem]" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-1.2px", lineHeight: 1.1 }}>
            {content.title}
          </h2>
        </div>
        <div className="sg-fx-dcs mt-6 grid min-h-[26rem] place-items-center overflow-hidden px-4 pb-10 pt-16" style={{ gridTemplateAreas: "'stack'" }}>
          {items.map((c, i) => (
            <div key={`${c.title}-${i}`} className={`sg-fx-dc sg-fx-dc-${i + 1}`} style={{ gridArea: "stack" }}>
              <div className="sg-fx-dc-head">
                <span className="sg-fx-dc-icon">{SPARKLES}</span>
                <p className="sg-fx-dc-title">{c.title}</p>
              </div>
              <p className="sg-fx-dc-desc">{c.desc}</p>
              <p className="sg-fx-dc-meta">{c.meta}</p>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        .sg-fx-dc{position:relative;display:flex;height:9rem;width:22rem;box-sizing:border-box;transform:skewY(-8deg);
          user-select:none;flex-direction:column;justify-content:space-between;border-radius:.75rem;
          border:2px solid rgba(255,255,255,.08);background:color-mix(in srgb,var(--c-ink) 60%,#fff 6%);
          backdrop-filter:blur(8px);padding:.75rem 1rem;
          transition:transform .7s cubic-bezier(.22,.61,.36,1),border-color .7s,background .7s,filter .7s}
        .sg-fx-dc-head{display:flex;align-items:center;gap:.5rem;position:relative;z-index:1;margin:0}
        .sg-fx-dc::after{content:'';position:absolute;right:-.25rem;top:-5%;height:110%;width:20rem;
          background:linear-gradient(to left,var(--c-ink),transparent);pointer-events:none;z-index:2}
        .sg-fx-dc:hover{border-color:rgba(255,255,255,.2)}
        .sg-fx-dc-icon{display:inline-grid;place-items:center;border-radius:9999px;width:1.7rem;height:1.7rem;flex:none;
          background:color-mix(in srgb,var(--c-accent) 30%,var(--c-ink));color:var(--c-accent2)}
        .sg-fx-dc-title{font-size:1.05rem;font-weight:600;margin:0;color:var(--c-accent2)}
        .sg-fx-dc-desc{font-size:1.02rem;color:#e7e9f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;position:relative;z-index:1;margin:0}
        .sg-fx-dc-meta{font-size:.92rem;color:rgba(231,233,240,.55);position:relative;z-index:1;margin:0}
        .sg-fx-dc-1,.sg-fx-dc-2{filter:grayscale(1)}
        .sg-fx-dc-1::before,.sg-fx-dc-2::before{content:'';position:absolute;inset:0;border-radius:inherit;
          background:color-mix(in srgb,var(--c-ink) 50%,transparent);opacity:1;transition:opacity .7s;z-index:2}
        .sg-fx-dc-1:hover,.sg-fx-dc-2:hover{filter:grayscale(0)}
        .sg-fx-dc-1:hover::before,.sg-fx-dc-2:hover::before{opacity:0}
        .sg-fx-dc-2{transform:skewY(-8deg) translate(3rem,2.5rem)}
        .sg-fx-dc-3{transform:skewY(-8deg) translate(6rem,5rem)}
        .sg-fx-dc-1:hover{transform:skewY(-8deg) translateY(-2.5rem)}
        .sg-fx-dc-2:hover{transform:skewY(-8deg) translate(3rem,-.25rem)}
        .sg-fx-dc-3:hover{transform:skewY(-8deg) translate(6rem,2.5rem)}
        @media (max-width:640px){
          .sg-fx-dc{width:17rem;height:8.25rem}
          .sg-fx-dc::after{width:15rem}
          .sg-fx-dc-2{transform:skewY(-8deg) translate(2rem,2rem)}
          .sg-fx-dc-3{transform:skewY(-8deg) translate(4rem,4rem)}
          .sg-fx-dc-1:hover{transform:skewY(-8deg) translateY(-1.5rem)}
          .sg-fx-dc-2:hover{transform:skewY(-8deg) translate(2rem,0)}
          .sg-fx-dc-3:hover{transform:skewY(-8deg) translate(4rem,2rem)}
        }
        @media (prefers-reduced-motion:reduce){.sg-fx-dc{transition:none}}
      `}</style>
    </section>
  );
}
