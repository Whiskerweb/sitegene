import type { Variants } from "framer-motion";

/** Easings signature (cf. DESIGN_SYSTEM.md §4). */
export const EASE = [0.22, 1, 0.36, 1] as const;
export const EASE_POP = [0.34, 1.56, 0.64, 1] as const;

/** Entrée standard au scroll. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: EASE },
  }),
};

/** Reveal de titre mot par mot (clip depuis y:110% dans un parent overflow-hidden). */
export const headingWord: Variants = {
  hidden: { y: "110%" },
  visible: (i: number = 0) => ({
    y: 0,
    transition: { delay: 0.1 + i * 0.14, duration: 0.7, ease: EASE },
  }),
};

/** Pop récompensant (badge prix, "en ligne"). */
export const pop: Variants = {
  hidden: { scale: 0.6, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.5, ease: EASE_POP },
  },
};

/** Conteneur qui stagger ses enfants. */
export const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

/** Réglage viewport partagé. */
export const viewportOnce = { once: true, margin: "-80px" } as const;
