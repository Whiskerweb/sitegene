// components/foundry/components/HeroSplitAsym.tsx
import type { Skin } from "@/lib/foundry/types";

interface HeroContent {
  badge: string; title: string; subtitle: string; cta: string;
  proofCount: string; proofLabel: string;
  image: string; image2: string; avatars: string[];
}

export default function HeroSplitAsym({ content, skin }: { content: HeroContent; skin: Skin }) {
  const root: React.CSSProperties = {};
  if (skin.accent) root["--c-accent" as keyof React.CSSProperties] = skin.accent as never;
  return (
    <section className="px-5 pt-28 pb-16 md:pt-36" style={{ background: "var(--c-surface)", ...root }}>
      <div className="mx-auto grid max-w-[1280px] items-start gap-10 lg:grid-cols-[minmax(0,1fr)_440px_320px]">
        {/* gauche */}
        <div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-[var(--r-pill)] px-3 py-1.5 text-sm font-bold text-white" style={{ background: "var(--c-accent)" }}>★ {content.badge}</span>
          </div>
          <h1 className="mt-7 max-w-[560px] text-[2.6rem] leading-[1.12] md:text-[4rem]" style={{ fontFamily: "var(--font-heading)", color: "var(--c-ink)", letterSpacing: "-2px" }}>{content.title}</h1>
          <p className="mt-7 max-w-[400px] text-base leading-relaxed" style={{ color: "var(--c-accent)" }}>{content.subtitle}</p>
          <a href="#tarifs" className="mt-8 inline-flex rounded-[var(--r-pill)] px-7 py-3.5 text-sm font-bold text-white transition hover:brightness-95" style={{ background: "var(--c-accent)" }}>{content.cta}</a>
          <div className="mt-12 flex items-center gap-4">
            <div className="flex -space-x-3">
              {content.avatars.map((a, i) => (
                <img key={i} src={a} alt="" className="h-10 w-10 rounded-full object-cover ring-2" style={{ borderColor: "var(--c-surface)" }} />
              ))}
            </div>
            <p className="max-w-[210px] text-sm font-bold leading-snug" style={{ color: "var(--c-accent)" }}>
              <span style={{ color: "var(--c-accent2)" }}>{content.proofCount}</span> {content.proofLabel}
            </p>
          </div>
        </div>
        {/* centre */}
        <div className="overflow-hidden rounded-[var(--r-xl)]">
          <img src={content.image} alt="" className="h-[440px] w-full object-cover object-top md:h-[560px]" />
        </div>
        {/* droite */}
        <div className="overflow-hidden rounded-[var(--r-xl)]">
          <img src={content.image2} alt="" className="h-[300px] w-full object-cover md:h-[360px]" />
        </div>
      </div>
    </section>
  );
}
