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
  /** [3.3] Champs étendus par catégorie. */
  experienceYears?: string;
  /** Musicien : genre musical. */
  genre?: string;
  /** Musicien/portfolio : liens réseaux & profils (Instagram, GitHub…). */
  socialLinks?: string;
  /** Musicien : liens vers sons/extraits (Spotify, SoundCloud…). */
  musicLinks?: string;
  /** Musicien : prochaines dates de représentation. */
  upcomingDates?: string;
  /** Artisan : métier principal + sous-spécialités. */
  trade?: string;
  /** Artisan : zone d'intervention. */
  area?: string;
  /** Artisan : labels et certifications (RGE, Qualibat…). */
  certifications?: string;
  /** Artisan : lien vers les avis clients (Google My Business…). */
  reviewsLink?: string;
  /** Portfolio : titre professionnel. */
  jobTitle?: string;
  /** Portfolio : compétences clés. */
  skills?: string;
  /** Portfolio : projets marquants (titre + description + lien). */
  projects?: string;
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

/**
 * [3.4] Question « site existant », posée TÔT : si le client a déjà un site,
 * on en extrait les infos (serveur) pour pré-remplir — et chaque champ couvert
 * ne sera plus demandé ([3.1]).
 */
const WEBSITE_QUESTION: OnboardingQuestion = {
  key: "websiteUrl",
  kind: "website",
  label: "Avez-vous déjà un site ou une page ?",
  help: "Collez son adresse — je récupère vos infos pour vous éviter de tout retaper.",
  placeholder: "https://mon-ancien-site.com",
};

const PHOTOGRAPHE_QUESTIONS: OnboardingQuestion[] = [
  {
    key: "brand",
    kind: "text",
    label: "Le nom de votre marque",
    help: "Votre studio, votre nom d'artiste — ce qui s'affiche en grand.",
    placeholder: "Ex. Alice R. Studio",
    prefillFrom: "brief",
  },
  WEBSITE_QUESTION,
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
    key: "experienceYears",
    kind: "text",
    label: "Depuis combien de temps photographiez-vous ?",
    help: "Facultatif — un chiffre qui rassure vos clients.",
    placeholder: "Ex. 8 ans",
  },
  {
    key: "priceRange",
    kind: "text",
    label: "Vos tarifs",
    help: "Facultatif. Un forfait ou une fourchette — affiché tel quel.",
    placeholder: "Ex. à partir de 350 € la séance",
  },
  {
    key: "photoUrls",
    kind: "photos",
    label: "Vos plus belles photos",
    help: "5 photos minimum recommandées — elles habillent tout le site, aucune image de démo ne reste.",
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
];

const MUSICIEN_QUESTIONS: OnboardingQuestion[] = [
  {
    key: "brand",
    kind: "text",
    label: "Votre nom d'artiste (ou de groupe)",
    placeholder: "Ex. Léo M.",
    prefillFrom: "brief",
  },
  WEBSITE_QUESTION,
  {
    key: "genre",
    kind: "text",
    label: "Votre genre musical",
    placeholder: "Ex. électro mélodique, jazz manouche…",
    pivotal: true,
  },
  {
    key: "about",
    kind: "textarea",
    label: "Votre bio, en quelques lignes",
    help: "Votre univers, votre parcours — ce que les bookers doivent retenir.",
    placeholder: "Producteur électro chaleureuse, sets live, 10 ans de scène…",
    prefillFrom: "brief",
  },
  {
    key: "socialLinks",
    kind: "textarea",
    label: "Vos réseaux",
    help: "Instagram, TikTok, YouTube… un lien par ligne.",
    placeholder: "https://instagram.com/…\nhttps://youtube.com/…",
  },
  {
    key: "musicLinks",
    kind: "textarea",
    label: "Vos sons",
    help: "Spotify, SoundCloud, Bandcamp… les liens vers vos meilleurs extraits.",
    placeholder: "https://open.spotify.com/…",
  },
  {
    key: "photoUrls",
    kind: "photos",
    label: "Vos visuels (live, presse, pochettes)",
  },
  {
    key: "techRider",
    kind: "textarea",
    label: "Votre fiche technique",
    help: "Matériel, configuration scène, besoins son & lumière. On crée la section dédiée.",
    placeholder: "2 platines + table de mixage, retours, ...",
  },
  {
    key: "upcomingDates",
    kind: "textarea",
    label: "Vos prochaines dates",
    help: "Facultatif — lieu + date, une par ligne.",
    placeholder: "12 juillet — Festival des Nuits, Arles",
  },
  {
    key: "contactEmail",
    kind: "text",
    label: "Contact booking",
    placeholder: "booking@vous.com",
    prefillFrom: "accountEmail",
  },
];

const ARTISAN_QUESTIONS: OnboardingQuestion[] = [
  {
    key: "brand",
    kind: "text",
    label: "Le nom de votre entreprise",
    placeholder: "Ex. Atelier Beaumont",
    prefillFrom: "brief",
  },
  WEBSITE_QUESTION,
  {
    key: "trade",
    kind: "textarea",
    label: "Votre métier et vos spécialités",
    help: "Ex. plombier → sanitaire, chauffage, débouchage. C'est ce qui structure le site.",
    placeholder: "Plombier chauffagiste : installation, dépannage, salle de bains clé en main",
    pivotal: true,
  },
  {
    key: "area",
    kind: "text",
    label: "Votre zone d'intervention",
    placeholder: "Ex. Nantes et 30 km alentour",
  },
  {
    key: "certifications",
    kind: "text",
    label: "Expérience, labels et certifications",
    help: "Facultatif. RGE, Qualibat, années de métier — tout ce qui rassure.",
    placeholder: "Ex. 15 ans de métier, certifié RGE",
  },
  {
    key: "priceRange",
    kind: "text",
    label: "Vos tarifs",
    help: "Facultatif. Taux horaire, forfait dépannage, devis gratuit…",
    placeholder: "Ex. devis gratuit, dépannage dès 90 €",
  },
  {
    key: "photoUrls",
    kind: "photos",
    label: "Photos de vos réalisations",
    help: "Avant/après, chantiers finis — c'est ce que vos clients regardent en premier.",
  },
  {
    key: "reviewsLink",
    kind: "text",
    label: "Un lien vers vos avis clients ?",
    help: "Facultatif. Votre fiche Google, PagesJaunes…",
    placeholder: "https://g.page/…",
  },
  {
    key: "contactPhone",
    kind: "text",
    label: "Le téléphone pour les demandes",
    help: "Affiché en évidence — c'est par là qu'arrivent les chantiers.",
    placeholder: "06 12 34 56 78",
  },
  {
    key: "contactEmail",
    kind: "text",
    label: "Votre email",
    placeholder: "contact@entreprise.fr",
    prefillFrom: "accountEmail",
  },
];

const PORTFOLIO_QUESTIONS: OnboardingQuestion[] = [
  {
    key: "brand",
    kind: "text",
    label: "Votre nom complet",
    placeholder: "Ex. Alex Morel",
    prefillFrom: "brief",
  },
  WEBSITE_QUESTION,
  {
    key: "jobTitle",
    kind: "text",
    label: "Votre titre professionnel",
    placeholder: "Ex. Développeur front-end, Designer produit…",
    pivotal: true,
  },
  {
    key: "about",
    kind: "textarea",
    label: "Votre parcours, en quelques lignes",
    help: "Formation, expériences clés, ce qui vous distingue.",
    placeholder: "10 ans entre agence et startup, spécialisé dans…",
    prefillFrom: "brief",
  },
  {
    key: "skills",
    kind: "text",
    label: "Vos compétences clés",
    help: "Séparées par des virgules — elles deviennent vos tags.",
    placeholder: "React, TypeScript, design system, UX…",
  },
  {
    key: "projects",
    kind: "textarea",
    label: "Vos projets marquants",
    help: "Titre + une phrase + lien si vous en avez. Un projet par ligne.",
    placeholder: "Refonte du site X — design + front (https://…)",
  },
  {
    key: "socialLinks",
    kind: "textarea",
    label: "Vos liens pro",
    help: "GitHub, Behance, LinkedIn… un lien par ligne.",
    placeholder: "https://github.com/…",
  },
  {
    key: "photoUrls",
    kind: "photos",
    label: "Des visuels de vos projets",
    help: "Captures, photos — facultatif mais ça fait toute la différence.",
  },
  {
    key: "availability",
    kind: "text",
    label: "Votre disponibilité",
    help: "Facultatif. En poste, ouvert aux missions, dispo en mai…",
    placeholder: "Ex. disponible pour missions freelance",
  },
  {
    key: "contactEmail",
    kind: "text",
    label: "Où vous contacter",
    placeholder: "vous@mail.com",
    prefillFrom: "accountEmail",
  },
];

const SAAS_QUESTIONS: OnboardingQuestion[] = [
  {
    key: "brand",
    kind: "text",
    label: "Le nom de votre produit",
    placeholder: "Ex. Healix",
    prefillFrom: "brief",
  },
  WEBSITE_QUESTION,
  {
    key: "about",
    kind: "textarea",
    label: "Que fait votre produit, et pour qui ?",
    help: "Deux phrases suffisent — c'est la base de votre page.",
    placeholder: "App de suivi santé pour les coachs sportifs : tracking, alertes, rapports.",
    pivotal: true,
    prefillFrom: "brief",
  },
  {
    key: "priceRange",
    kind: "text",
    label: "Votre tarif",
    help: "Facultatif. Abonnement, essai gratuit…",
    placeholder: "Ex. 19 €/mois, essai gratuit 14 jours",
  },
  {
    key: "photoUrls",
    kind: "photos",
    label: "Captures d'écran de votre produit",
  },
  {
    key: "contactEmail",
    kind: "text",
    label: "Votre email de contact",
    placeholder: "hello@produit.com",
    prefillFrom: "accountEmail",
  },
];

export const QUESTIONS_BY_CATEGORY: Record<string, OnboardingQuestion[]> = {
  photographe: PHOTOGRAPHE_QUESTIONS,
  musicien: MUSICIEN_QUESTIONS,
  artisan: ARTISAN_QUESTIONS,
  portfolio: PORTFOLIO_QUESTIONS,
  saas: SAAS_QUESTIONS,
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

/** Univers musical → template (l'ordre fait priorité). */
const MUSIC_GENRE_TEMPLATE: [needle: RegExp, templateId: string][] = [
  [/jazz|soul|swing|chant|vocal/, "jazz-vocalist"],
  [/\bdj\b|techno|house|club/, "dj-electro"],
  [/electro|collectif/, "electronic-collective"],
  [/rap|hip.?hop|beatmaker|trap/, "hiphop-producer"],
  [/podcast/, "podcast-audio"],
  [/festival/, "music-festival"],
  [/rock|indie|folk|pop|groupe|metal/, "indie-band"],
];

/** Corps de métier artisan → template (l'ordre fait priorité). */
const TRADE_TEMPLATE: [needle: RegExp, templateId: string][] = [
  [/plomb|chauffag|sanitair|debouch/, "plumber-pro"],
  [/electri/, "electrician-pro"],
  [/nettoyage|menage|entretien/, "cleaning-services"],
  [/jardin|paysag|espaces? verts/, "eco-garden-care"],
];

const normalizeReco = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

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
  // Photographe : la spécialité prime (mariage > … > corporate).
  const types = intake.eventTypes ?? [];
  if (types.length > 0) {
    for (const [event, templateId] of PHOTO_EVENT_TEMPLATE) {
      if (types.includes(event)) return templateId;
    }
    return "photographer-freelance";
  }

  // Musicien : le genre (ou le brief) choisit l'univers.
  if (intake.categoryId === "musicien") {
    const text = normalizeReco(`${intake.genre ?? ""} ${intake.brief ?? ""}`);
    for (const [needle, templateId] of MUSIC_GENRE_TEMPLATE) {
      if (needle.test(text)) return templateId;
    }
  }

  // Artisan : le corps de métier choisit le template dédié.
  if (intake.categoryId === "artisan") {
    const text = normalizeReco(`${intake.trade ?? ""} ${intake.brief ?? ""}`);
    for (const [needle, templateId] of TRADE_TEMPLATE) {
      if (needle.test(text)) return templateId;
    }
    return "multi-trade";
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
