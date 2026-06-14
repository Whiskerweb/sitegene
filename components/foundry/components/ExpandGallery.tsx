"use client";
// components/foundry/components/ExpandGallery.tsx
// Import adapté (style « expand-on-hover ») : rangée d'images où celle survolée
// s'AGRANDIT (les autres se rétrécissent), transition fluide. MODULABLE : N
// images. Desktop = rangée extensible ; mobile = grille 2 colonnes. CSS vars.
import { useState } from "react";
import type { Skin } from "@/lib/foundry/types";
import { Eyebrow } from "../primitives";

export default function ExpandGallery({ content }: { content: any; skin: Skin }) {
  const images: string[] = Array.isArray(content?.images) ? content.images.filter((x: unknown) => typeof x === "string" && x) : [];
  const [exp, setExp] = useState(0);

  return (
    <section className="px-5 py-16 md:py-24" style={{ background: "var(--c-surface)" }}>
      <div className="mx-auto max-w-6xl">
        {(content?.eyebrow || content?.title) && (
          <div className="mb-10 text-center">
            {content?.eyebrow && <Eyebrow>{content.eyebrow}</Eyebrow>}
            {content?.title && (
              <h2 className="mt-3 text-[2rem] md:text-[2.8rem]" style={{ fontFamily: "var(--font-heading)", color: "var(--c-ink)", letterSpacing: "-1.2px", lineHeight: 1.1 }}>{content.title}</h2>
            )}
          </div>
        )}

        {/* Desktop : rangée extensible au survol */}
        <div className="hidden h-[24rem] w-full gap-1.5 overflow-hidden md:flex">
          {images.map((src, i) => (
            <div
              key={i}
              onMouseEnter={() => setExp(i)}
              className="relative cursor-pointer overflow-hidden rounded-3xl transition-[flex-grow] duration-500 ease-in-out"
              style={{ flexGrow: i === exp ? 6 : 1, flexBasis: 0, minWidth: 0 }}
            >
              <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>

        {/* Mobile : grille simple */}
        <div className="grid grid-cols-2 gap-2 md:hidden">
          {images.map((src, i) => (
            <img key={i} src={src} alt="" loading="lazy" className="aspect-square w-full rounded-2xl object-cover" />
          ))}
        </div>
      </div>
    </section>
  );
}
