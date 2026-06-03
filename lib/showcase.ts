/**
 * Réalisations vitrines Akyra — source unique pour la galerie d'accueil et la
 * page /modeles (filtrable par catégorie). Les visuels sont les aperçus
 * canoniques de public/landing/. Lien = aperçu live (démo /s/{id} ou externe).
 */
export type Realisation = {
  id: string;
  title: string;
  /** Libellé d'affichage de la catégorie. */
  category: string;
  /** Id de catégorie pour le filtre. */
  categoryId: "photographe" | "artisan" | "musicien" | "portfolio" | "saas";
  views: number;
  thumb: string;
  link: string;
  external?: boolean;
  /** Mis en avant dans la section « À la une » de l'accueil. */
  featured?: boolean;
  badge?: "PRO" | "Nouveau";
};

export const REALISATIONS: Realisation[] = [
  {
    id: "target",
    title: "Target — Magazine minimal",
    category: "Photographe",
    categoryId: "photographe",
    views: 149,
    thumb: "/landing/tpl-target.png",
    link: "/s/target",
    featured: true,
    badge: "PRO",
  },
  {
    id: "potozon",
    title: "Potozon — Studio créatif",
    category: "Photographe",
    categoryId: "photographe",
    views: 153,
    thumb: "/landing/tpl-potozon.png",
    link: "/s/potozon",
    featured: true,
  },
  {
    id: "alice-r",
    title: "Alice R. — Portrait éditorial",
    category: "Photographe",
    categoryId: "photographe",
    views: 159,
    thumb: "/landing/tpl-alice-r.png",
    link: "/s/alice-r",
    featured: true,
    badge: "PRO",
  },
  {
    id: "arelec",
    title: "A-Relec — Électricité & chauffage",
    category: "Artisan",
    categoryId: "artisan",
    views: 132,
    thumb: "/landing/tpl-arelec.png",
    link: "https://a-relec.vercel.app",
    external: true,
    featured: true,
    badge: "Nouveau",
  },
  {
    id: "eloctix",
    title: "Eloctix — Installation électrique",
    category: "Artisan",
    categoryId: "artisan",
    views: 118,
    thumb: "/landing/tpl-eloctix.png",
    link: "/#apercu",
    featured: true,
    badge: "Nouveau",
  },
  {
    id: "cleaning-services",
    title: "Ménage & services à domicile",
    category: "Artisan",
    categoryId: "artisan",
    views: 96,
    thumb: "/landing/tpl-cleaning-services.png",
    link: "/s/cleaning-services",
    badge: "Nouveau",
  },
  {
    id: "eco-garden-care",
    title: "Paysagiste & entretien de jardin",
    category: "Artisan",
    categoryId: "artisan",
    views: 88,
    thumb: "/landing/tpl-eco-garden-care.png",
    link: "/s/eco-garden-care",
    badge: "Nouveau",
  },
  {
    id: "creative-portfolio",
    title: "Portfolio créatif — Designer",
    category: "Portfolio",
    categoryId: "portfolio",
    views: 74,
    thumb: "/landing/tpl-creative-portfolio.png",
    link: "/s/creative-portfolio",
    featured: true,
    badge: "Nouveau",
  },
  {
    id: "health-saas",
    title: "App / SaaS — Santé connectée",
    category: "SaaS",
    categoryId: "saas",
    views: 81,
    thumb: "/landing/tpl-health-saas.png",
    link: "/s/health-saas",
    featured: true,
    badge: "Nouveau",
  },
  {
    id: "luxury-wedding",
    title: "Mariage premium — Studio",
    category: "Photographe",
    categoryId: "photographe",
    views: 112,
    thumb: "/landing/tpl-luxury-wedding.png",
    link: "/s/luxury-wedding",
    badge: "Nouveau",
  },
  {
    id: "wedding-fine-art",
    title: "Mariage fine-art — Narratif",
    category: "Photographe",
    categoryId: "photographe",
    views: 104,
    thumb: "/landing/tpl-wedding-fine-art.png",
    link: "/s/wedding-fine-art",
    badge: "Nouveau",
  },
];

/** Filtres de catégorie pour /modeles (dérivés des réalisations + « bientôt »). */
export const SHOWCASE_FILTERS: { id: string; label: string; soon?: boolean }[] = [
  { id: "tous", label: "Tous" },
  { id: "photographe", label: "Photographe" },
  { id: "artisan", label: "Artisan" },
  { id: "portfolio", label: "Portfolio" },
  { id: "saas", label: "SaaS" },
  { id: "musicien", label: "Musicien", soon: true },
];

export const FEATURED = REALISATIONS.filter((r) => r.featured);
