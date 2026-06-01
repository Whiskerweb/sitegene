/** Localisation d'une note épinglée (stockée dans notes.selector jsonb). Aucune capture. */
export type PinSelector = {
  path?: string; // data-sg-path / data-sg-img de l'élément cible, si présent
  cssSelector: string; // sélecteur CSS de repli vers l'élément
  label: string; // libellé lisible (ex. « bouton « Réserver » », « photo »)
  xPct: number; // position du clic en % de la largeur totale du document (0–100)
  yPct: number; // position du clic en % de la hauteur totale du document (0–100)
  offset?: { dx: number; dy: number }; // point exact du clic DANS l'élément cible (0–1)
};

const clampPct = (n: unknown): number | null => {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v) || v < 0 || v > 100) return null;
  return Math.round(v * 100) / 100;
};

const clamp01 = (n: unknown): number => {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return 0.5;
  return Math.max(0, Math.min(1, Math.round(v * 1000) / 1000));
};

/** Valide/normalise un selector venant du client. Retourne null si invalide. */
export function parsePinSelector(input: unknown): PinSelector | null {
  if (!input || typeof input !== "object") return null;
  const o = input as Record<string, unknown>;
  const cssSelector = typeof o.cssSelector === "string" ? o.cssSelector.slice(0, 400) : "";
  const label = typeof o.label === "string" ? o.label.slice(0, 80) : "";
  const xPct = clampPct(o.xPct);
  const yPct = clampPct(o.yPct);
  if (!cssSelector || xPct === null || yPct === null) return null;
  const path = typeof o.path === "string" && o.path.length <= 200 ? o.path : undefined;
  const off = o.offset && typeof o.offset === "object" ? (o.offset as Record<string, unknown>) : null;
  const offset =
    off && Number.isFinite(Number(off.dx)) && Number.isFinite(Number(off.dy))
      ? { dx: clamp01(off.dx), dy: clamp01(off.dy) }
      : undefined;
  return {
    ...(path ? { path } : {}),
    cssSelector,
    label,
    xPct,
    yPct,
    ...(offset ? { offset } : {}),
  };
}
