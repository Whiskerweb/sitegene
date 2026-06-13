"use client";
// components/foundry/components/ParallaxStrip.tsx
// « Image scroll » : bandeau photo immersif pleine largeur — l'image glisse en
// parallaxe pendant le défilement, voile dégradé encre, accroche + CTA posés
// dessus. Le bloc design qui rythme une page entre deux sections de contenu.
import type { Skin } from "@/lib/foundry/types";
import { useParallax, Reveal } from "../fx";

interface ParallaxStripContent {
  eyebrow: string;
  title: string;
  cta?: string;
  image: string;
}

export default function ParallaxStrip({ content }: { content: ParallaxStripContent; skin: Skin }) {
  const { ref, style } = useParallax(70);
  return (
    <section ref={ref} className="relative overflow-hidden" style={{ height: "min(72vh, 560px)", background: "var(--c-panel)" }}>
      <img
        src={content.image}
        alt=""
        className="absolute left-0 w-full object-cover"
        style={{ ...style, top: "-12%", height: "124%" }}
      />
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, color-mix(in srgb, var(--c-panel) 30%, transparent), color-mix(in srgb, var(--c-panel) 72%, transparent))" }} />
      <div className="absolute inset-0 flex items-center px-5">
        <div className="mx-auto w-full max-w-[1280px]">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">{content.eyebrow}</p>
            <h2 className="mt-4 max-w-2xl text-[2.2rem] leading-[1.08] text-white md:text-[3.4rem]" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-1.5px" }}>
              {content.title}
            </h2>
            {content.cta ? (
              <a
                href="#contact"
                className="mt-8 inline-flex items-center gap-2 rounded-[var(--r-pill)] px-6 py-3 text-sm font-semibold transition-all hover:brightness-110"
                style={{ background: "var(--c-accent)", color: "var(--c-on-accent)" }}
              >
                {content.cta}
                <span aria-hidden>→</span>
              </a>
            ) : null}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
