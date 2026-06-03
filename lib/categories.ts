/**
 * Catégories de métiers couvertes par Akyra. Source de vérité unique pour le
 * positionnement multi-catégories de la landing (titre cyclant, chips, exemples,
 * témoignages) et pour le mapping catégorie → templates disponibles.
 *
 * Aujourd'hui seul `photographe` est actif ; `musicien` et `artisan` sont
 * annoncés « bientôt » (active:false, pas de templates encore).
 */
import type { TemplateId } from "@/lib/templates";

export type CategoryId =
  | "photographe"
  | "musicien"
  | "artisan"
  | "portfolio"
  | "saas";

export type CategoryTestimonial = {
  quote: string;
  name: string;
  role: string;
  tone: string;
};

export type Category = {
  id: CategoryId;
  /** Libellé d'affichage (chip). */
  label: string;
  /** Mot inséré dans le titre cyclant du hero. */
  cyclingWord: string;
  /** Parcours réellement disponible (sinon « bientôt »). */
  active: boolean;
  /** Phrase courte de réassurance, spécifique au métier. */
  tagline: string;
  /** Exemple de brief injecté dans le champ (placeholder dynamique). */
  briefPlaceholder: string;
  /** Exemple de sous-domaine, pour illustrer le résultat. */
  exampleDomain: string;
  /** Templates proposés pour ce métier (sous-ensemble de TEMPLATE_IDS). */
  templateIds: TemplateId[];
  /** Template utilisé pour la première génération. */
  defaultTemplateId: TemplateId;
  testimonial: CategoryTestimonial;
};

export const CATEGORIES: Category[] = [
  {
    id: "photographe",
    label: "Photographe",
    cyclingWord: "photographe",
    active: true,
    tagline: "Vos images méritent un vrai écrin.",
    briefPlaceholder:
      "Ex. Camille, photographe mariage à Lyon.\nLumière naturelle, émotions vraies, zéro pose forcée.\nDisponible partout en France.",
    exampleDomain: "camille.akyra.io",
    templateIds: ["alice-r", "potozon", "target", "luxury-wedding", "wedding-fine-art"],
    defaultTemplateId: "alice-r",
    testimonial: {
      quote:
        "J'ai enfin un site qui ressemble à mon travail. Mes clients me prennent au sérieux.",
      name: "Camille D.",
      role: "Photographe mariage",
      tone: "#fbe6f0",
    },
  },
  {
    id: "musicien",
    label: "Musicien",
    cyclingWord: "musicien",
    active: true,
    tagline: "Votre univers sonore, enfin en ligne.",
    briefPlaceholder:
      "Ex. Léo, producteur & DJ à Marseille.\nÉlectro chaleureuse, sets live, clips.\nDisponible pour clubs et festivals.",
    exampleDomain: "leo.akyra.io",
    templateIds: ["jazz-vocalist", "dj-electro", "electronic-collective", "hiphop-producer", "indie-band", "music-festival", "podcast-audio"],
    defaultTemplateId: "jazz-vocalist",
    testimonial: {
      quote:
        "Mes dates, mes sons, mon univers — tout au même endroit. Les bookers adorent.",
      name: "Léo M.",
      role: "Producteur / DJ",
      tone: "#dce9f7",
    },
  },
  {
    id: "artisan",
    label: "Artisan",
    cyclingWord: "artisan",
    active: true,
    tagline: "Votre savoir-faire, mis en valeur.",
    briefPlaceholder:
      "Ex. Atelier Beaumont, ébéniste à Nantes.\nMobilier sur mesure, bois massif, pièces uniques.\nDevis sous 48 h.",
    exampleDomain: "beaumont.akyra.io",
    templateIds: ["cleaning-services", "eco-garden-care"],
    defaultTemplateId: "cleaning-services",
    testimonial: {
      quote:
        "Un site qui respire le sérieux de mon atelier. Je reçois des demandes chaque semaine.",
      name: "Hugo B.",
      role: "Ébéniste",
      tone: "#e2f3e6",
    },
  },
  {
    id: "portfolio",
    label: "Portfolio / Créatif",
    cyclingWord: "créatif",
    active: true,
    tagline: "Votre travail, mis en scène.",
    briefPlaceholder:
      "Ex. Alex, designer & directeur artistique à Paris.\nIdentités de marque, sites, direction créative.\nDisponible en freelance.",
    exampleDomain: "alex.akyra.io",
    templateIds: ["creative-portfolio"],
    defaultTemplateId: "creative-portfolio",
    testimonial: {
      quote:
        "Un portfolio qui parle enfin pour moi. Les clients arrivent déjà convaincus.",
      name: "Alex M.",
      role: "Designer",
      tone: "#ececec",
    },
  },
  {
    id: "saas",
    label: "SaaS / App",
    cyclingWord: "startup",
    active: true,
    tagline: "Votre produit, expliqué et vendu.",
    briefPlaceholder:
      "Ex. Healix, app de suivi santé.\nTracking, alertes, abonnement.\nEssai gratuit.",
    exampleDomain: "healix.akyra.io",
    templateIds: ["health-saas"],
    defaultTemplateId: "health-saas",
    testimonial: {
      quote:
        "Notre landing convertit enfin. Le pricing et les preuves sociales font le job.",
      name: "Sam R.",
      role: "Fondateur SaaS",
      tone: "#eaf2f0",
    },
  },
];

export const ACTIVE_CATEGORIES = CATEGORIES.filter((c) => c.active);

export const DEFAULT_CATEGORY = CATEGORIES[0];

export function getCategory(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}
