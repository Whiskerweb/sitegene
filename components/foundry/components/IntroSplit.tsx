// components/foundry/components/IntroSplit.tsx
import { Eyebrow } from "../primitives";
import type { Skin } from "@/lib/foundry/types";

interface IntroContent { eyebrow: string; title: string; body: string; image: string; points?: string[] }

export default function IntroSplit({ content }: { content: IntroContent; skin: Skin }) {
  return (
    <section id="apropos" className="px-5 py-16 md:py-24" style={{ background: "var(--c-surface)" }}>
      <div className="mx-auto grid max-w-[1280px] items-center gap-12 md:grid-cols-2">
        <div className="overflow-hidden rounded-[var(--r-xl)]">
          <img src={content.image} alt="" className="h-[380px] w-full object-cover md:h-[460px]" />
        </div>
        <div>
          <Eyebrow>{content.eyebrow}</Eyebrow>
          <h2 className="mt-4 max-w-md text-[2rem] md:text-[3rem]" style={{ fontFamily: "var(--font-heading)", color: "var(--c-ink)", letterSpacing: "-1.5px", lineHeight: 1.12 }}>
            {content.title}
          </h2>
          <p className="mt-5 max-w-md leading-relaxed" style={{ color: "var(--c-accent)" }}>{content.body}</p>
          {content.points && content.points.length > 0 && (
            <ul className="mt-6 flex flex-col gap-3">
              {content.points.map((p) => (
                <li key={p} className="flex items-center gap-3 text-sm" style={{ color: "var(--c-ink)" }}>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full text-xs" style={{ background: "color-mix(in srgb, var(--c-accent) 18%, transparent)", color: "var(--c-accent)" }}>✓</span>
                  {p}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
