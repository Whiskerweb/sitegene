"use client";

import type { ReactNode } from "react";
import { motion, type Variants } from "framer-motion";

/**
 * Entoure un mot/groupe inline d'un cercle dessiné à la main qui s'anime
 * (pathLength). Adapté de hand-writing-text (KokonutUI) en version inline :
 * l'ellipse est posée DERRIÈRE le texte, mise à l'échelle du conteneur.
 */
export function CircledText({
  children,
  className = "",
  stroke = "currentColor",
  delay = 0.6,
}: {
  children: ReactNode;
  className?: string;
  stroke?: string;
  delay?: number;
}) {
  const draw: Variants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: {
          duration: 1.6,
          ease: [0.43, 0.13, 0.23, 0.96] as const,
          delay,
        },
        opacity: { duration: 0.4, delay },
      },
    },
  };

  return (
    <span className={`relative inline-block ${className}`}>
      {/* le texte d'abord (définit la taille de la boîte) */}
      <span className="relative z-10">{children}</span>

      {/* ellipse manuscrite par-dessus/autour, débordant légèrement */}
      <motion.svg
        aria-hidden
        viewBox="0 0 1200 300"
        preserveAspectRatio="none"
        initial="hidden"
        animate="visible"
        className="pointer-events-none absolute left-1/2 top-1/2 z-20 h-[150%] w-[124%] -translate-x-1/2 -translate-y-1/2 overflow-visible"
      >
        <motion.path
          d="M 980 70
             C 1190 150, 1080 250, 600 268
             C 180 268, 40 230, 60 150
             C 80 70, 360 40, 640 44
             C 900 48, 1010 70, 1040 96"
          fill="none"
          strokeWidth="9"
          stroke={stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={draw}
        />
      </motion.svg>
    </span>
  );
}
