// components/foundry/components/ProcessSteps.tsx
import { Eyebrow } from "../primitives";
import type { Skin } from "@/lib/foundry/types";

interface Step { n: string; title: string; desc: string }
interface ProcessContent { eyebrow: string; title: string; steps: Step[] }

export default function ProcessSteps({ content }: { content: ProcessContent; skin: Skin }) {
  return (
    <section className="px-5 py-16 md:py-24" style={{ background: "var(--c-card)" }}>
      <div className="mx-auto max-w-[1280px]">
        <div className="max-w-2xl">
          <Eyebrow>{content.eyebrow}</Eyebrow>
          <h2 className="mt-4 text-[2rem] md:text-[3rem]" style={{ fontFamily: "var(--font-heading)", color: "var(--c-ink)", letterSpacing: "-1.5px", lineHeight: 1.12 }}>
            {content.title}
          </h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {content.steps.map((s, i) => (
            <div key={i} className="rounded-[var(--r-card)] p-7" style={{ background: "var(--c-surface)", border: "1px solid color-mix(in srgb, var(--c-accent) 12%, transparent)" }}>
              <span className="flex h-11 w-11 items-center justify-center rounded-full text-lg text-white" style={{ background: "var(--c-accent)", fontFamily: "var(--font-heading)" }}>{s.n}</span>
              <h3 className="mt-5 text-xl" style={{ fontFamily: "var(--font-heading)", color: "var(--c-ink)" }}>{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--c-accent)" }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
