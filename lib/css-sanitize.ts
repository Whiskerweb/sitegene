/**
 * Garde-fou pour le CSS personnalisé généré par l'IA (injecté dans le site).
 * Le CSS ne doit jamais pouvoir casser hors de la balise <style> ni exécuter de JS.
 * On refuse en bloc tout motif dangereux (liste noire) + on borne la taille.
 */
export type CssCheck = { ok: true; css: string } | { ok: false; reason: string };

const BANNED = [
  "<", // empêche </style>, <script>, etc.
  "javascript:",
  "expression(",
  "@import",
  "-moz-binding",
  "behavior:",
];

export function sanitizeCss(input: unknown): CssCheck {
  if (typeof input !== "string") return { ok: false, reason: "CSS manquant." };
  const css = input.trim();
  if (!css) return { ok: false, reason: "CSS vide." };
  if (css.length > 20000) return { ok: false, reason: "CSS trop long (max 20000)." };
  const lower = css.toLowerCase();
  for (const b of BANNED) {
    if (lower.includes(b)) return { ok: false, reason: `Motif interdit dans le CSS : « ${b} ».` };
  }
  // data: autorisé uniquement pour des images (jamais data:text/html, etc.).
  if (/url\(\s*['"]?\s*data:(?!image\/)/i.test(css)) {
    return { ok: false, reason: "URL data: non-image interdite." };
  }
  return { ok: true, css };
}
