"use client";
// components/foundry/components/BookingCta.tsx
// LOT « music-a » — CTA BOOKING : image plein cadre (N&B) + voile dégradé,
// eyebrow, titre CONDENSÉ XXL, court paragraphe et bouton accent (e-mail/lien).
// MODULABLE : texte + bouton optionnels. CSS vars only.
import type { Skin } from "@/lib/foundry/types";

export default function BookingCta({ content }: { content: any; skin: Skin }) {
  const href = content?.email ? `mailto:${content.email}` : content?.href || "#";
  return (
    <section className="relative overflow-hidden" style={{ background: "var(--c-panel)" }}>
      {content?.image && (
        <img src={content.image} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ filter: "grayscale(1)", opacity: 0.3 }} />
      )}
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, var(--c-panel) 0%, color-mix(in srgb, var(--c-panel) 80%, transparent) 45%, color-mix(in srgb, var(--c-panel) 45%, transparent) 100%)" }} />

      <div className="relative z-10 mx-auto max-w-4xl px-5 py-28 text-center md:py-36">
        {content?.label && (
          <p className="mb-6 text-[12px] font-medium uppercase tracking-[0.22em]" style={{ color: "var(--c-accent)", fontFamily: "var(--font-label, var(--font-body))" }}>{content.label}</p>
        )}
        {content?.title && (
          <h2 className="text-6xl uppercase sm:text-8xl md:text-[8rem]" style={{ fontFamily: "var(--font-heading)", color: "var(--c-on-panel)", fontWeight: 800, lineHeight: 0.9 }}>
            {content.title}
          </h2>
        )}
        {content?.text && (
          <p className="mx-auto mt-8 max-w-2xl text-base md:text-lg" style={{ color: "var(--c-muted)", fontFamily: "var(--font-body)" }}>{content.text}</p>
        )}
        {(content?.cta || content?.email) && (
          <a
            href={href}
            className="mt-12 inline-flex items-center px-9 py-4 text-[12px] font-medium uppercase tracking-[0.18em] transition-opacity hover:opacity-90"
            style={{ background: "var(--c-accent)", color: "var(--c-on-accent)", borderRadius: "var(--r-pill)", fontFamily: "var(--font-label, var(--font-body))" }}
          >
            {content?.cta || "Get in Touch"}
          </a>
        )}
      </div>
    </section>
  );
}
