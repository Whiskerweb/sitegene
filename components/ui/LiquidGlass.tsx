"use client";

import type { ReactNode } from "react";

/**
 * Filtre SVG de distorsion « liquid glass » (réfraction réelle du fond, pas un
 * simple blur). À monter UNE fois par page ; les surfaces l'utilisent via
 * backdrop-filter:url(#sg-liquid). Inspiré des patterns 21st.dev, calibré doux
 * pour rester lisible sur la DA Cloud claire.
 */
export function LiquidGlassFilter() {
  return (
    <svg aria-hidden className="pointer-events-none absolute h-0 w-0">
      <defs>
        <filter id="sg-liquid" x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.006 0.012" numOctaves="2" seed="14" result="noise" />
          <feGaussianBlur in="noise" stdDeviation="2.4" result="soft" />
          <feDisplacementMap in="SourceGraphic" in2="soft" scale="42" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}

/**
 * Surface en verre liquide : distorsion du fond (couche dédiée) + liseré
 * lumineux (.liquid-glass) + contenu net au-dessus.
 */
export function LiquidGlass({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`liquid-glass ${className}`}>
      {/* Couche de réfraction : floute+distord ce qui est derrière la carte */}
      <span
        aria-hidden
        className="absolute inset-0 -z-10 rounded-[inherit]"
        style={{ backdropFilter: "url(#sg-liquid)", WebkitBackdropFilter: "url(#sg-liquid)" }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
