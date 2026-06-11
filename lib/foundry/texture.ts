// lib/foundry/texture.ts
// Couche d'ATMOSPHÈRE de fond pilotée par la DA (CSS-only, perf-safe, derrière le
// contenu). Chaque `texture` produit un `background` CSS posé sur un calque
// absolu `aria-hidden`. Pur (testable) : pas de JSX ici.
import type { Texture } from "./types";

/**
 * `background` CSS d'un calque de texture, ou "" si aucune. Les couleurs sont
 * dérivées des vars de la DA (accent/border/surface) → l'atmosphère suit la
 * charte. Volontairement discret (faibles opacités) pour rester un fond.
 */
export function textureBackground(texture: Texture | undefined): string {
  switch (texture) {
    case "grain":
      // Bruit fractal SVG en data-URI, très atténué (grain photographique).
      return (
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")"
      );
    case "grid":
      // Grille technique fine, teintée par la bordure de la DA.
      return (
        "linear-gradient(var(--c-border) 1px, transparent 1px), linear-gradient(90deg, var(--c-border) 1px, transparent 1px)"
      );
    case "glow":
      // Halo radial haut, teinté accent (ambiance « projecteur »).
      return (
        "radial-gradient(60% 45% at 50% 0%, color-mix(in srgb, var(--c-accent) 22%, transparent), transparent 70%)"
      );
    case "gradient-mesh":
      // Maillage de halos accent/secondaire (ambiance vivante).
      return [
        "radial-gradient(40% 40% at 15% 10%, color-mix(in srgb, var(--c-accent) 20%, transparent), transparent 70%)",
        "radial-gradient(45% 45% at 85% 20%, color-mix(in srgb, var(--c-secondary) 18%, transparent), transparent 70%)",
        "radial-gradient(50% 50% at 50% 100%, color-mix(in srgb, var(--c-accent) 12%, transparent), transparent 70%)",
      ].join(", ");
    case "none":
    default:
      return "";
  }
}

/** Réglages d'opacité/taille du calque selon la texture (le reste = défauts). */
export function textureLayerStyle(texture: Texture | undefined): {
  background: string;
  opacity: number;
  backgroundSize?: string;
} | null {
  const background = textureBackground(texture);
  if (!background) return null;
  switch (texture) {
    case "grain":
      return { background, opacity: 0.06 };
    case "grid":
      return { background, opacity: 0.5, backgroundSize: "64px 64px" };
    case "glow":
      return { background, opacity: 0.9 };
    case "gradient-mesh":
      return { background, opacity: 0.8 };
    default:
      return { background, opacity: 1 };
  }
}
