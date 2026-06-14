"use client";
// components/foundry/components/FaqAccordion.tsx
import { useState } from "react";
import { Eyebrow } from "../primitives";
import type { Skin } from "@/lib/foundry/types";

interface FaqItem { q: string; a: string }
interface FaqContent { eyebrow: string; title: string; items: FaqItem[] }

export default function FaqAccordion({ content }: { content: FaqContent; skin: Skin }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="px-5 py-16 md:py-24" style={{ background: "var(--c-surface)" }}>
      <div className="mx-auto grid max-w-[1280px] gap-12 md:grid-cols-[0.8fr_1.2fr]">
        <div>
          <Eyebrow>{content.eyebrow}</Eyebrow>
          <h2
            className="mt-4 max-w-sm text-[2rem] md:text-[3rem]"
            style={{ fontFamily: "var(--font-heading)", color: "var(--c-ink)", letterSpacing: "-1.5px", lineHeight: 1.15 }}
          >
            {content.title}
          </h2>
        </div>
        <div className="flex flex-col">
          {content.items.map((it, i) => {
            const isOpen = open === i;
            return (
              <div key={i} className="border-t" style={{ borderColor: "color-mix(in srgb, var(--c-accent) 18%, transparent)" }}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-6 py-6 text-left"
                >
                  <span className="text-lg md:text-xl" style={{ fontFamily: "var(--font-heading)", color: "var(--c-ink)" }}>{it.q}</span>
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg transition-transform duration-300"
                    style={{
                      border: "1px solid color-mix(in srgb, var(--c-accent) 25%, transparent)",
                      color: isOpen ? "#fff" : "var(--c-accent)",
                      background: isOpen ? "var(--c-accent)" : "transparent",
                      transform: isOpen ? "rotate(45deg)" : "none",
                    }}
                  >
                    +
                  </span>
                </button>
                {/* animation de hauteur pure CSS via grid-rows 0fr→1fr */}
                <div className="grid transition-all duration-300" style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}>
                  <div className="overflow-hidden">
                    <p className="max-w-xl pb-6 leading-relaxed" style={{ color: "var(--c-accent)" }}>{it.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
