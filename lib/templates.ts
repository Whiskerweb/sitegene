/** Identifiants des templates disponibles (photographes pour l'instant). */
export const TEMPLATE_IDS = ["alice-r", "potozon", "target", "cleaning-services", "eco-garden-care", "creative-portfolio", "health-saas", "luxury-wedding", "wedding-fine-art"] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];

export function isTemplateId(x: string): x is TemplateId {
  return (TEMPLATE_IDS as readonly string[]).includes(x);
}

/** Méta d'affichage des templates pour le reveal multi-DA (nom + descripteur de style). */
export const TEMPLATE_META: Partial<Record<TemplateId, { name: string; style: string }>> = {
  "alice-r": { name: "Éditorial", style: "Sombre & chaleureux, magazine" },
  potozon: { name: "Galerie", style: "Épuré, place aux images" },
  target: { name: "Audacieux", style: "Contrasté, signature forte" },
};

/** Méta d'affichage avec repli sûr (templates sans entrée dédiée). */
export function templateMeta(id: string): { name: string; style: string } {
  return TEMPLATE_META[id as TemplateId] ?? { name: "Signature", style: "Direction artistique" };
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
  "editor",
  "apercu",
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
