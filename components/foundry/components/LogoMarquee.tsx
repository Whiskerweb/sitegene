// components/foundry/components/LogoMarquee.tsx
import type { Skin } from "@/lib/foundry/types";

interface LogoContent { title?: string; items: string[] }

export default function LogoMarquee({ content }: { content: LogoContent; skin: Skin }) {
  const loop = [...content.items, ...content.items];
  return (
    <section
      className="overflow-hidden border-y py-8"
      style={{ background: "var(--c-surface)", borderColor: "color-mix(in srgb, var(--c-accent) 14%, transparent)" }}
    >
      {content.title && (
        <p className="mb-6 text-center text-sm font-medium" style={{ color: "var(--c-accent)" }}>{content.title}</p>
      )}
      <div className="foundry-marquee flex w-max items-center gap-14 px-7">
        {loop.map((l, i) => (
          <span
            key={i}
            className="shrink-0 text-xl font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-heading)", color: "color-mix(in srgb, var(--c-ink) 50%, var(--c-surface))" }}
          >
            {l}
          </span>
        ))}
      </div>
    </section>
  );
}
