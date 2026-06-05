/**
 * Configuration du parcours d'onboarding guidé (self-serve).
 *
 * Deux responsabilités, data-driven et extensibles par métier :
 *  1. `QUESTIONS_BY_CATEGORY` — la liste ordonnée de « questions-cartes » que le
 *     composer révèle une par une. On guide sans imposer : presque tout est
 *     optionnel et pré-rempli (deviné, modifiable).
 *  2. `dropSectionsForIntake` — l'adaptation du template au client : selon les
 *     réponses spécifiques au métier (photographe → type d'événement, musicien
 *     → fiche technique), on RETIRE les sections du template qui ne collent pas.
 *     On n'impose pas la template, on l'ajuste.
 *
 * Module partagé client/serveur : le client lit les questions, le serveur lit
 * les règles de sections.
 */

export type QuestionKind =
  | "text"
  | "textarea"
  | "multiselect"
  | "photos"
  | "website"; // boolean « j'ai déjà un site » + URL (extraction = Phase 2)

export type QuestionOption = { value: string; label: string };

export type OnboardingQuestion = {
  /** Clé dans l'objet intake. */
  key: string;
  kind: QuestionKind;
  /** Intitulé court de la carte. */
  label: string;
  /** Sous-texte d'aide (ton concierge, jamais « IA »). */
  help?: string;
  placeholder?: string;
  options?: QuestionOption[];
  /** Question structurante (pilote l'adaptation des sections). */
  pivotal?: boolean;
  /** D'où vient le pré-remplissage. */
  prefillFrom?: "brief" | "accountEmail";
};

/** Réponses accumulées pendant le parcours (schéma libre, JSON en base). */
export type Intake = {
  brief?: string;
  /** [2.1] Métier détecté/confirmé — pilote les questions et les templates. */
  categoryId?: string;
  /** [2.2] Vrai quand le client a confirmé son métier (ou détection sûre). */
  categoryConfirmed?: boolean;
  brand?: string;
  /** Photographe : types d'événements couverts. */
  eventTypes?: string[];
  /** Musicien : fiche technique (rider). */
  techRider?: string;
  services?: string[];
  about?: string;
  contactEmail?: string;
  contactPhone?: string;
  hasWebsite?: boolean;
  websiteUrl?: string;
  /** URLs publiques (Storage) des photos déposées, dans l'ordre. */
  photoUrls?: string[];
  /** Réponses du chatbot d'affinage (étape 2 du tunnel outreach). */
  wantsPricingPage?: boolean;
  priceRange?: string;
  instagram?: string;
  city?: string;
  availability?: string;
  tone?: "chaleureux" | "premium" | "naturel";
};

// ---------------------------------------------------------------------------
// Questions par métier
// ---------------------------------------------------------------------------

export const PHOTO_EVENT_OPTIONS: QuestionOption[] = [
  { value: "mariage", label: "Mariage" },
  { value: "portrait", label: "Portrait" },
  { value: "famille", label: "Famille" },
  { value: "grossesse", label: "Naissance & grossesse" },
  { value: "corporate", label: "Entreprise & corporate" },
  { value: "mode", label: "Mode & éditorial" },
  { value: "evenementiel", label: "Événementiel & concert" },
  { value: "immobilier", label: "Immobilier & architecture" },
  { value: "culinaire", label: "Culinaire" },
  { value: "animalier", label: "Animalier" },
];

const PHOTOGRAPHE_QUESTIONS: OnboardingQuestion[] = [
  {
    key: "brand",
    kind: "text",
    label: "Le nom de votre marque",
    help: "Votre studio, votre nom d'artiste — ce qui s'affiche en grand.",
    placeholder: "Ex. Alice R. Studio",
    prefillFrom: "brief",
  },
  {
    key: "eventTypes",
    kind: "multiselect",
    label: "Ce que vous photographiez",
    help: "Sélectionnez vos spécialités. On ajuste le site à ce que vous faites — rien d'imposé.",
    options: PHOTO_EVENT_OPTIONS,
    pivotal: true,
    prefillFrom: "brief",
  },
  {
    key: "photoUrls",
    kind: "photos",
    label: "Vos plus belles photos",
    help: "Glissez vos images : elles remplacent les visuels de démo en direct.",
  },
  {
    key: "about",
    kind: "textarea",
    label: "Votre histoire, en deux phrases",
    help: "Facultatif. Ce qui vous rend unique, votre approche.",
    placeholder: "Lumière naturelle, émotions vraies, zéro pose forcée.",
    prefillFrom: "brief",
  },
  {
    key: "contactEmail",
    kind: "text",
    label: "Où vous joindre",
    help: "L'email qui reçoit les demandes de vos clients.",
    placeholder: "vous@studio.com",
    prefillFrom: "accountEmail",
  },
  {
    key: "websiteUrl",
    kind: "website",
    label: "Avez-vous déjà un site ?",
    help: "Collez son adresse — on s'en servira pour aller plus vite (bientôt automatique).",
    placeholder: "https://mon-ancien-site.com",
  },
];

const MUSICIEN_QUESTIONS: OnboardingQuestion[] = [
  {
    key: "brand",
    kind: "text",
    label: "Votre nom d'artiste",
    placeholder: "Ex. Léo M.",
    prefillFrom: "brief",
  },
  {
    key: "techRider",
    kind: "textarea",
    label: "Votre fiche technique",
    help: "Matériel, configuration scène, besoins son & lumière. On crée la section dédiée.",
    placeholder: "2 platines + table de mixage, retours, ...",
    pivotal: true,
  },
  {
    key: "photoUrls",
    kind: "photos",
    label: "Vos visuels (live, presse, pochettes)",
  },
  {
    key: "contactEmail",
    kind: "text",
    label: "Contact booking",
    placeholder: "booking@vous.com",
    prefillFrom: "accountEmail",
  },
];

export const QUESTIONS_BY_CATEGORY: Record<string, OnboardingQuestion[]> = {
  photographe: PHOTOGRAPHE_QUESTIONS,
  musicien: MUSICIEN_QUESTIONS,
};

export function questionsFor(categoryId: string): OnboardingQuestion[] {
  return QUESTIONS_BY_CATEGORY[categoryId] ?? PHOTOGRAPHE_QUESTIONS;
}

/** Libellé FR lisible d'un type d'événement (sert de nom de service). */
export function eventLabel(value: string): string {
  return PHOTO_EVENT_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

// ---------------------------------------------------------------------------
// Recommandation de template (« l'IA a trouvé votre style »)
// ---------------------------------------------------------------------------

/**
 * Spécialité photographe → template dont l'univers colle le mieux. L'ordre des
 * entrées fait office de priorité quand plusieurs spécialités sont cochées
 * (le mariage l'emporte sur le reste, etc.).
 */
const PHOTO_EVENT_TEMPLATE: [event: string, templateId: string][] = [
  ["mariage", "luxury-wedding"],
  ["grossesse", "portrait-lifestyle"],
  ["famille", "portrait-lifestyle"],
  ["portrait", "portrait-fineart"],
  ["mode", "portrait-fineart"],
  ["immobilier", "landscape-prints"],
  ["culinaire", "photo-vintage"],
  ["animalier", "portrait-lifestyle"],
  ["corporate", "photographer-freelance"],
  ["evenementiel", "photographer-freelance"],
];

/**
 * Template que « l'IA » recommande à la fin de la conversation, déduit des
 * réponses. Pur et partagé client/serveur : le client peut calculer la
 * recommandation localement, sans aller-retour. Repli : défaut fourni par
 * l'appelant (template phare de la catégorie).
 */
export function recommendTemplateForIntake(
  intake: Intake,
  fallbackTemplateId: string,
): string {
  const types = intake.eventTypes ?? [];
  if (types.length > 0) {
    for (const [event, templateId] of PHOTO_EVENT_TEMPLATE) {
      if (types.includes(event)) return templateId;
    }
    return "photographer-freelance";
  }
  return fallbackTemplateId;
}

// ---------------------------------------------------------------------------
// Adaptation des sections (ajuster la template au client, sans l'imposer)
// ---------------------------------------------------------------------------

/**
 * Sections d'un template considérées comme « optionnelles » : on peut les retirer
 * en toute sécurité si elles ne collent pas au client. Tout le reste est conservé.
 * Clés = noms de section tels que listés dans manifest.sections.home.
 */
const REMOVABLE_SECTIONS: Record<string, string[]> = {
  "alice-r": ["collaborations", "beyond", "works"],
  potozon: ["collaborations", "stats", "clients"],
  target: ["collaborations", "stats", "clients"],
};

export type SectionDirective = { drop: string[]; reasons: string[] };

/**
 * Calcule les sections à retirer du template pour un intake donné. Conservateur :
 * ne retire QUE des sections marquées optionnelles pour ce template.
 */
export function dropSectionsForIntake(
  categoryId: string,
  templateId: string,
  intake: Intake,
): SectionDirective {
  const removable = new Set(REMOVABLE_SECTIONS[templateId] ?? []);
  const drop: string[] = [];
  const reasons: string[] = [];

  const consider = (section: string, reason: string) => {
    if (removable.has(section) && !drop.includes(section)) {
      drop.push(section);
      reasons.push(reason);
    }
  };

  if (categoryId === "photographe") {
    const types = intake.eventTypes ?? [];
    const doesBrands = types.includes("corporate") || types.includes("mode");
    // Le bandeau de marques/collaborations n'a de sens qu'en corporate/mode.
    if (types.length > 0 && !doesBrands) {
      consider("collaborations", "Pas de travail corporate/mode déclaré.");
      consider("clients", "Pas de clients marques déclarés.");
    }
    // Études de cas « works » : on les garde dès qu'il y a ≥ 2 spécialités,
    // sinon on évite une section trop vide pour un profil très spécialisé.
    if (types.length === 1) {
      consider("works", "Profil mono-spécialité : works retiré au profit de la galerie.");
    }
  }

  return { drop, reasons };
}
