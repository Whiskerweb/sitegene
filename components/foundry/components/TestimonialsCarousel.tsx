// components/foundry/components/TestimonialsCarousel.tsx
import { Eyebrow } from "../primitives";
import type { Skin } from "@/lib/foundry/types";

interface Testi { text: string; name: string; role: string; avatar: string }
interface TestiContent { eyebrow: string; title: string; items: Testi[] }

export default function TestimonialsCarousel({ content }: { content: TestiContent; skin: Skin }) {
  const loop = [...content.items, ...content.items];
  return (
    <section id="temoignages" className="overflow-hidden py-16 md:py-24" style={{ background: "var(--c-surface)" }}>
      <div className="mx-auto mb-12 max-w-[1280px] px-5 text-center">
        <div className="flex justify-center"><Eyebrow>{content.eyebrow}</Eyebrow></div>
        <h2 className="mx-auto mt-4 max-w-2xl text-[2rem] md:text-[3.2rem]" style={{ fontFamily: "var(--font-heading)", color: "var(--c-ink)", letterSpacing: "-1.5px", lineHeight: 1.15 }}>{content.title}</h2>
      </div>
      <div className="overflow-hidden">
        <div className="foundry-marquee flex w-max gap-6 px-3">
          {loop.map((t, i) => (
            <figure key={i} className="w-[360px] shrink-0 rounded-[var(--r-card)] p-8" style={{ background: "var(--c-card)" }}>
              <blockquote className="text-xl leading-relaxed" style={{ color: "var(--c-ink)" }}>« {t.text} »</blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <img src={t.avatar} alt="" className="h-11 w-11 rounded-full object-cover" />
                <span><span className="block font-bold" style={{ color: "var(--c-ink)" }}>{t.name}</span><span className="text-sm" style={{ color: "var(--c-muted)" }}>{t.role}</span></span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
