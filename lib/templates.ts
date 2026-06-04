/** Identifiants des templates disponibles (photographes pour l'instant). */
export const TEMPLATE_IDS = ["alice-r", "potozon", "target", "cleaning-services", "eco-garden-care", "creative-portfolio", "health-saas", "luxury-wedding", "wedding-fine-art", "jazz-vocalist", "hiphop-producer", "electronic-collective", "indie-band", "music-festival", "podcast-audio", "dj-electro", "studio-portfolio", "analytics-saas", "plumber-pro", "plumber-emergency", "multi-trade", "plumber-modern", "electrician-pro", "photographer-freelance", "wedding-warm", "landscape-prints", "photo-vintage", "portrait-fineart", "portrait-lifestyle", "eloctix"] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];

export function isTemplateId(x: string): x is TemplateId {
  return (TEMPLATE_IDS as readonly string[]).includes(x);
}

/**
 * Lignée SPA (bundles Vite qui consomment un contenu v2 multi-pages).
 * Tout le reste = lignée HTML (clone-site) : shell statique annoté
 * data-sg-path/data-sg-img dont l'hydratation lit window.__SITE_CONTENT__
 * À PLAT — ne jamais leur servir un contenu enveloppé v2.
 */
export const SPA_TEMPLATE_IDS: readonly string[] = ["alice-r", "potozon", "target", "eloctix"];

export function isSpaTemplate(id: string): boolean {
  return SPA_TEMPLATE_IDS.includes(id);
}

/** Méta d'affichage des templates pour le reveal multi-DA (nom + descripteur de style). */
export const TEMPLATE_META: Partial<Record<TemplateId, { name: string; style: string }>> = {
  "alice-r": { name: "Éditorial", style: "Sombre & chaleureux, magazine" },
  potozon: { name: "Galerie", style: "Épuré, place aux images" },
  target: { name: "Audacieux", style: "Contrasté, signature forte" },
  "luxury-wedding": { name: "Mariage Prestige", style: "Luxueux, cinématique" },
  "wedding-fine-art": { name: "Mariage Fine-Art", style: "Lumineux, délicat" },
  "wedding-warm": { name: "Mariage Chaleureux", style: "Tons chauds, intime" },
  "portrait-fineart": { name: "Portrait d'Art", style: "Élégant, intemporel" },
  "portrait-lifestyle": { name: "Lifestyle", style: "Naturel, spontané" },
  "photographer-freelance": { name: "Indépendant", style: "Direct, polyvalent" },
  "photo-vintage": { name: "Vintage", style: "Argentique, rétro" },
  "landscape-prints": { name: "Paysages", style: "Grands espaces, tirages" },
  "jazz-vocalist": { name: "Voix Jazz", style: "Feutré, scène" },
  "dj-electro": { name: "DJ Électro", style: "Néon, énergie" },
  "hiphop-producer": { name: "Producteur", style: "Urbain, percutant" },
  "indie-band": { name: "Groupe Indé", style: "Brut, authentique" },
  "electronic-collective": { name: "Collectif", style: "Sombre, immersif" },
  "music-festival": { name: "Festival", style: "Vibrant, événementiel" },
  "podcast-audio": { name: "Podcast", style: "Éditorial, voix" },
  "cleaning-services": { name: "Services Pro", style: "Net, rassurant" },
  "eco-garden-care": { name: "Jardin & Éco", style: "Végétal, frais" },
  "plumber-pro": { name: "Artisan Confiance", style: "Sérieux, local" },
  "plumber-modern": { name: "Artisan Moderne", style: "Bleu, efficace" },
  "plumber-emergency": { name: "Urgences 24/7", style: "Réactif, contrasté" },
  "electrician-pro": { name: "Électricien Pro", style: "Technique, fiable" },
  "multi-trade": { name: "Multi-métiers", style: "Complet, structuré" },
  eloctix: { name: "Eloctix", style: "Épuré, technique" },
  "creative-portfolio": { name: "Portfolio Créatif", style: "Coloré, personnel" },
  "studio-portfolio": { name: "Studio", style: "Minimal, direction artistique" },
  "health-saas": { name: "Santé", style: "Doux, innovant" },
  "analytics-saas": { name: "Analytics", style: "Data, moderne" },
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
