// components/foundry/components/ServicesRows.tsx
import { Section, Eyebrow } from "../primitives";
import type { Skin } from "@/lib/foundry/types";

interface ServiceItem { n: string; name: string; desc: string }
interface ServicesContent { eyebrow: string; title: string; items: ServiceItem[] }

export default function ServicesRows({ content }: { content: ServicesContent; skin: Skin }) {
  return (
    <Section id="services">
      <Eyebrow>{content.eyebrow}</Eyebrow>
      <h2 className="mt-4 max-w-xl text-[2rem] md:text-[3.2rem]" style={{ fontFamily: "var(--font-heading)", color: "var(--c-ink)", letterSpacing: "-1.5px", lineHeight: 1.15 }}>{content.title}</h2>
      <div className="mt-10">
        {content.items.map((it, i) => (
          <div key={i} className="grid items-center gap-4 border-t py-8 md:grid-cols-[80px_1fr_1.2fr]" style={{ borderColor: "color-mix(in srgb, var(--c-accent) 18%, transparent)" }}>
            <span className="text-3xl" style={{ fontFamily: "var(--font-heading)", color: "var(--c-accent)" }}>{it.n}</span>
            <h3 className="text-[1.6rem] md:text-[2.25rem]" style={{ fontFamily: "var(--font-heading)", color: "var(--c-ink)", letterSpacing: "-1px" }}>{it.name}</h3>
            <p style={{ color: "var(--c-accent)" }}>{it.desc}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
