/** Identifiants des templates disponibles (photographes pour l'instant). */
export const TEMPLATE_IDS = ["alice-r", "potozon", "target"] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];

export function isTemplateId(x: string): x is TemplateId {
  return (TEMPLATE_IDS as readonly string[]).includes(x);
}

/** Slugs réservés (ne peuvent pas être pris par un client). */
export const RESERVED_SLUGS = new Set([
  "app",
  "api",
  "admin",
  "www",
  "s",
  "r",
  "_templates",
  "dashboard",
  "login",
  "welcome",
  "robots.txt",
  "sitemap.xml",
  "demo",
]);

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/;

/** Normalise un nom saisi en slug ([a-z0-9-], 2–40 chars). */
export function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function isValidSlug(slug: string): boolean {
  return SLUG_RE.test(slug) && !RESERVED_SLUGS.has(slug);
}
