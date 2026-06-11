// components/foundry/components/CtaBanner.tsx
import type { Skin } from "@/lib/foundry/types";

interface CtaContent { title: string; cta: string; image?: string }

export default function CtaBanner({ content }: { content: CtaContent; skin: Skin }) {
  return (
    <section className="px-5 py-8" style={{ background: "var(--c-surface)" }}>
      <div className="relative mx-auto max-w-[1280px] overflow-hidden rounded-[var(--r-xl)]" style={{ background: "var(--c-ink)" }}>
        {content.image && (
          <>
            <img src={content.image} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-25" />
            <div className="absolute inset-0" style={{ background: "color-mix(in srgb, var(--c-ink) 78%, transparent)" }} />
          </>
        )}
        <div className="relative z-10 mx-auto max-w-2xl px-6 py-20 text-center md:py-28">
          <h2
            className="mx-auto max-w-xl text-[2rem] md:text-[2.75rem]"
            style={{ fontFamily: "var(--font-heading)", color: "var(--c-surface)", letterSpacing: "-1px", lineHeight: 1.15 }}
          >
            {content.title}
          </h2>
          <a
            href="#tarifs"
            className="mt-8 inline-flex rounded-[var(--r-pill)] px-8 py-4 font-bold transition hover:brightness-95"
            style={{ background: "var(--c-accent)", color: "var(--c-on-accent)" }}
          >
            {content.cta}
          </a>
        </div>
      </div>
    </section>
  );
}
