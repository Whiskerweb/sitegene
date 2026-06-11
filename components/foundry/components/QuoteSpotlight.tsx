"use client";
// components/foundry/components/QuoteSpotlight.tsx
// Manifeste : une seule grande citation, plein cadre encre, guillemet géant
// en filigrane accent. Respiration typographique forte entre deux sections —
// la phrase qui dit pourquoi on fait ce métier.
import type { Skin } from "@/lib/foundry/types";
import { Reveal } from "../fx";

interface QuoteSpotlightContent {
  quote: string;
  author: string;
  role: string;
}

export default function QuoteSpotlight({ content }: { content: QuoteSpotlightContent; skin: Skin }) {
  return (
    <section className="relative overflow-hidden px-5 py-20 md:py-28" style={{ background: "var(--c-ink)" }}>
      <span
        aria-hidden
        className="pointer-events-none absolute -top-10 left-4 select-none text-[16rem] leading-none md:text-[24rem]"
        style={{ color: "color-mix(in srgb, var(--c-accent) 26%, transparent)", fontFamily: "var(--font-heading)" }}
      >
        “
      </span>
      <div className="relative mx-auto max-w-[980px] text-center">
        <Reveal>
          <blockquote
            className="text-[1.7rem] leading-[1.3] md:text-[2.6rem]"
            style={{ fontFamily: "var(--font-heading)", color: "#fff", letterSpacing: "-0.8px" }}
          >
            {content.quote}
          </blockquote>
          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--c-accent2)" }}>{content.author}</p>
          <p className="mt-1 text-sm text-white/55">{content.role}</p>
        </Reveal>
      </div>
    </section>
  );
}
