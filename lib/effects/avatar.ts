/**
 * Avatars autonomes pour les composants témoignages : initiale sur fond
 * coloré en SVG data-URI — aucune dépendance réseau (pas de pravatar/unsplash
 * dans les sites clients), aucune photo à fournir par l'IA.
 */

const HEX_RE = /^#[0-9a-fA-F]{3,8}$/;

function safeColor(c: string, fallback: string): string {
  return HEX_RE.test(c) ? c : fallback;
}

/** Avatar rond (cartes shuffle). */
export function initialAvatarRound(name: string, bg: string): string {
  const initial = (name.trim().charAt(0) || "•").toUpperCase();
  const fill = safeColor(bg, "#64748b");
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128">` +
    `<rect width="128" height="128" rx="64" fill="${fill}"/>` +
    `<text x="50%" y="50%" dy=".36em" text-anchor="middle" ` +
    `font-family="system-ui,sans-serif" font-size="56" font-weight="700" ` +
    `fill="#ffffff">${initial}</text></svg>`;
  return "data:image/svg+xml," + encodeURIComponent(svg);
}

/** Avatar rectangulaire (frise stagger, format 48×56 de l'original). */
export function initialAvatarRect(name: string, bg: string): string {
  const initial = (name.trim().charAt(0) || "•").toUpperCase();
  const fill = safeColor(bg, "#64748b");
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="112">` +
    `<rect width="96" height="112" fill="${fill}"/>` +
    `<text x="50%" y="50%" dy=".36em" text-anchor="middle" ` +
    `font-family="system-ui,sans-serif" font-size="44" font-weight="700" ` +
    `fill="#ffffff">${initial}</text></svg>`;
  return "data:image/svg+xml," + encodeURIComponent(svg);
}
