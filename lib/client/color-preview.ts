// lib/client/color-preview.ts
// Petits utilitaires couleur pour les APERÇUS de chartes côté navigateur
// (cartes de l'étape DA, composeur d'identité). Purs, sans dépendance.

/** Mélange linéaire de deux hex (#rrggbb), t = part de b. */
export function mixHex(a: string, b: string, t: number): string {
  const pa = a.replace("#", "");
  const pb = b.replace("#", "");
  const c = [0, 2, 4].map((i) => {
    const va = parseInt(pa.slice(i, i + 2), 16);
    const vb = parseInt(pb.slice(i, i + 2), 16);
    return Math.round(va + (vb - va) * t);
  });
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/** Rampe de 4 teintes (clair → foncé) autour d'une couleur, façon planche DS. */
export function ramp(hex: string): string[] {
  return [mixHex(hex, "#ffffff", 0.62), mixHex(hex, "#ffffff", 0.3), hex, mixHex(hex, "#000000", 0.28)];
}

/** Luminance perçue (0..1) d'un hex. */
export function lum(hex: string): number {
  const p = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(p.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Couleur de texte lisible posée sur `bg` (même logique que --c-on-accent). */
export function readableOn(bg: string): string {
  return lum(bg) > 0.55 ? "#16140f" : "#ffffff";
}
