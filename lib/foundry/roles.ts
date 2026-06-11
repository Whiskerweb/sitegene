// lib/foundry/roles.ts
// Libellés FR + ordre canonique des rôles de section. Partagé entre le
// catalogue dashboard, l'API de génération (cartes du booster) et l'éditeur.

export const ROLE_LABEL: Record<string, string> = {
  navbar: "Barre de navigation",
  hero: "Hero",
  logos: "Bandeau de confiance",
  about: "À propos",
  services: "Services",
  process: "Étapes",
  stats: "Chiffres clés",
  highlights: "Temps forts",
  reviews: "Avis clients",
  gallery: "Galerie",
  media: "Image immersive",
  team: "L'équipe",
  story: "Parcours",
  statement: "Manifeste",
  pricing: "Tarifs",
  faq: "FAQ",
  contact: "Contact",
  cta: "Appel à l'action",
  decor: "Décor",
  footer: "Footer",
  effets: "Effets",
};

export const ROLE_ORDER = [
  "navbar",
  "hero",
  "logos",
  "about",
  "services",
  "process",
  "stats",
  "highlights",
  "reviews",
  "gallery",
  "media",
  "team",
  "story",
  "statement",
  "pricing",
  "faq",
  "contact",
  "cta",
  "decor",
  "footer",
  "effets",
];

export function roleLabel(role: string): string {
  return ROLE_LABEL[role] ?? role;
}
