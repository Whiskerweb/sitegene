// components/foundry/components/PricingCards.tsx
import { Eyebrow } from "../primitives";
import type { Skin } from "@/lib/foundry/types";

interface Plan { name: string; price: string; period: string; desc?: string; features: string[]; cta: string; featured?: boolean }
interface PricingContent { eyebrow: string; title: string; plans: Plan[] }

export default function PricingCards({ content }: { content: PricingContent; skin: Skin }) {
  return (
    <section id="tarifs" className="px-5 py-16 md:py-24" style={{ background: "var(--c-surface)" }}>
      <div className="mx-auto max-w-[1280px]">
        <div className="mx-auto max-w-2xl text-center">
          <div className="flex justify-center"><Eyebrow>{content.eyebrow}</Eyebrow></div>
          <h2 className="mt-4 text-[2rem] md:text-[3rem]" style={{ fontFamily: "var(--font-heading)", color: "var(--c-ink)", letterSpacing: "-1.5px", lineHeight: 1.15 }}>
            {content.title}
          </h2>
        </div>
        {/* Flex centré (pas une grille à colonnes fixes) : 1 ou 2 formules
            restent au CENTRE, 3 remplissent le cadre. */}
        <div className="mt-12 flex flex-wrap items-stretch justify-center gap-6">
          {content.plans.map((p, i) => {
            const f = !!p.featured;
            return (
              <div
                key={i}
                className="flex max-w-[420px] flex-1 basis-[300px] flex-col rounded-[var(--r-card)] p-8"
                style={f
                  ? { background: "var(--c-ink)", color: "#fbf9f5", boxShadow: "0 30px 70px -30px rgba(13,5,3,.55)" }
                  : { background: "var(--c-card)", border: "1px solid color-mix(in srgb, var(--c-accent) 14%, transparent)" }}
              >
                <span className="text-sm font-bold uppercase tracking-wide" style={{ color: f ? "var(--c-accent2)" : "var(--c-accent)" }}>{p.name}</span>
                <div className="mt-4 flex items-end gap-1">
                  <span className="text-5xl" style={{ fontFamily: "var(--font-heading)", color: f ? "#fbf9f5" : "var(--c-ink)" }}>{p.price}</span>
                  <span className="mb-1 text-sm" style={{ color: f ? "rgba(251,249,245,.6)" : "var(--c-accent)" }}>{p.period}</span>
                </div>
                {p.desc && <p className="mt-3 text-sm leading-relaxed" style={{ color: f ? "rgba(251,249,245,.7)" : "var(--c-accent)" }}>{p.desc}</p>}
                <ul className="mt-6 flex flex-1 flex-col gap-2.5 text-sm" style={{ color: f ? "rgba(251,249,245,.85)" : "var(--c-ink)" }}>
                  {p.features.map((ft) => (
                    <li key={ft} className="flex items-start gap-2">
                      <span className="mt-0.5 shrink-0 font-bold" style={{ color: f ? "var(--c-accent2)" : "var(--c-accent)" }}>✓</span>
                      {ft}
                    </li>
                  ))}
                </ul>
                <a
                  href="#top"
                  className="mt-8 rounded-[var(--r-pill)] px-6 py-3.5 text-center font-bold transition hover:brightness-95"
                  style={f ? { background: "var(--c-accent2)", color: "var(--c-ink)" } : { background: "var(--c-accent)", color: "var(--c-on-accent)" }}
                >
                  {p.cta}
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
