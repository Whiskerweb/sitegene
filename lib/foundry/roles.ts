// lib/foundry/roles.ts
// Libellés FR + ordre canonique des rôles de section. Partagé entre le
// catalogue dashboard, l'API de génération (cartes du booster) et l'éditeur.

export const ROLE_LABEL: Record<string, string> = {
  hero: "Hero",
  logos: "Bandeau de confiance",
  about: "À propos",
  services: "Services",
  process: "Étapes",
  stats: "Chiffres clés",
  reviews: "Avis clients",
  gallery: "Galerie",
  media: "Média",
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
  "hero",
  "logos",
  "about",
  "services",
  "process",
  "stats",
  "reviews",
  "gallery",
  "media",
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
