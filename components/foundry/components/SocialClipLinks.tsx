"use client";
// components/foundry/components/SocialClipLinks.tsx
// Import adapté (style « clip-path-links ») : grille de liens (réseaux / contact)
// où, au survol, un calque accent se RÉVÈLE en clip-path depuis le côté le plus
// proche du curseur. Réécrit SANS framer-motion (mutation DOM + transition CSS).
// MODULABLE : grille responsive de N liens. CSS vars + SocialIcon.
import { useRef } from "react";
import type { CSSProperties } from "react";
import type { Skin } from "@/lib/foundry/types";
import { Eyebrow } from "../primitives";
import SocialIcon from "./SocialIcon";

const NO_CLIP = "polygon(0 0, 100% 0, 100% 100%, 0% 100%)";
const BR = "polygon(0 0, 100% 0, 0 0, 0% 100%)";
const TR = "polygon(0 0, 0 100%, 100% 100%, 0% 100%)";
const BL = "polygon(100% 100%, 100% 0, 100% 100%, 0 100%)";
const TL = "polygon(0 0, 100% 0, 100% 100%, 100% 0)";

interface Item { platform: string; href: string; label?: string }

function LinkBox({ item }: { item: Item }) {
  const ref = useRef<HTMLSpanElement>(null);
  const side = (e: React.MouseEvent) => {
    const b = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const d = [
      { p: Math.abs(b.left - e.clientX), s: "left" },
      { p: Math.abs(b.right - e.clientX), s: "right" },
      { p: Math.abs(b.top - e.clientY), s: "top" },
      { p: Math.abs(b.bottom - e.clientY), s: "bottom" },
    ].sort((a, z) => a.p - z.p);
    return d[0].s;
  };
  const enter = (e: React.MouseEvent) => {
    const el = ref.current; if (!el) return;
    el.style.transition = "none";
    el.style.clipPath = side(e) === "right" ? TL : BR;
    void el.offsetWidth;
    el.style.transition = "clip-path .3s ease";
    el.style.clipPath = NO_CLIP;
  };
  const leave = (e: React.MouseEvent) => {
    const el = ref.current; if (!el) return;
    el.style.transition = "clip-path .3s ease";
    el.style.clipPath = side(e) === "right" ? BL : TR;
  };
  return (
    <a
      href={item.href || "#"}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={enter}
      onMouseLeave={leave}
      aria-label={item.label || item.platform}
      className="relative grid h-20 w-full place-content-center sm:h-28 md:h-32"
      style={{ background: "var(--c-surface)", color: "var(--c-ink)" }}
    >
      <SocialIcon platform={item.platform} className="h-7 w-7 sm:h-8 sm:w-8" />
      <span ref={ref} className="absolute inset-0 grid place-content-center" style={{ clipPath: BR, background: "var(--c-accent)", color: "var(--c-on-accent, #fff)" }}>
        <SocialIcon platform={item.platform} className="h-7 w-7 sm:h-8 sm:w-8" />
      </span>
    </a>
  );
}

export default function SocialClipLinks({ content }: { content: any; skin: Skin }) {
  const root: CSSProperties = {};
  const items: Item[] = Array.isArray(content?.items) ? content.items : [];
  return (
    <section className="px-5 py-16 md:py-24" style={{ ...root, background: "var(--c-surface)" }}>
      <div className="mx-auto max-w-4xl">
        {(content?.eyebrow || content?.title) && (
          <div className="mb-8 text-center">
            {content?.eyebrow && <Eyebrow>{content.eyebrow}</Eyebrow>}
            {content?.title && (
              <h2 className="mt-3 text-[2rem] md:text-[2.6rem]" style={{ fontFamily: "var(--font-heading)", color: "var(--c-ink)", letterSpacing: "-1.2px", lineHeight: 1.1 }}>{content.title}</h2>
            )}
          </div>
        )}
        <div
          className="grid overflow-hidden rounded-[var(--r-card)] border"
          style={{ borderColor: "color-mix(in srgb, var(--c-ink) 12%, transparent)", gridTemplateColumns: `repeat(auto-fit, minmax(120px, 1fr))`, gap: "1px", background: "color-mix(in srgb, var(--c-ink) 12%, transparent)" }}
        >
          {items.map((it, i) => (<LinkBox key={i} item={it} />))}
        </div>
      </div>
    </section>
  );
}
