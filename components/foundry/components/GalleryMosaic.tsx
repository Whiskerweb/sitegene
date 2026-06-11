"use client";
// components/foundry/components/GalleryMosaic.tsx
// Galerie mosaïque : grille de photos aux hauteurs alternées, entrée en
// cascade au scroll, zoom doux au survol. Le bloc « réalisations » par
// excellence (chantiers, shootings, plats, avant/après…).
import type { Skin } from "@/lib/foundry/types";
import { Eyebrow } from "../primitives";
import { Reveal } from "../fx";

interface GalleryMosaicContent {
  eyebrow: string;
  title: string;
  images: string[];
}

/** Rythme des hauteurs (px) — répété sur la longueur de la galerie. */
const HEIGHTS = [300, 380, 340, 420, 320, 360];

export default function GalleryMosaic({ content }: { content: GalleryMosaicContent; skin: Skin }) {
  const images = (content.images ?? []).filter(Boolean);
  return (
    <section className="px-5 py-16 md:py-24" style={{ background: "var(--c-surface)" }}>
      <div className="mx-auto max-w-[1280px]">
        <Reveal>
          <Eyebrow>{content.eyebrow}</Eyebrow>
          <h2 className="mt-4 max-w-xl text-[2rem] md:text-[2.8rem]" style={{ fontFamily: "var(--font-heading)", color: "var(--c-ink)", letterSpacing: "-1.2px", lineHeight: 1.1 }}>
            {content.title}
          </h2>
        </Reveal>
        <div className="mt-10 gap-5 [column-fill:_balance] sm:columns-2 lg:columns-3">
          {images.map((src, i) => (
            <Reveal key={`${src}-${i}`} delay={(i % 3) * 110} className="mb-5 break-inside-avoid">
              <div className="group overflow-hidden rounded-[var(--r-card)]" style={{ background: "var(--c-card)" }}>
                <img
                  src={src}
                  alt=""
                  loading="lazy"
                  className="w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.045]"
                  style={{ height: HEIGHTS[i % HEIGHTS.length] }}
                />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
