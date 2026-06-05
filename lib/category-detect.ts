/**
 * [2.1] Détection du corps de métier depuis un texte libre (brief de la
 * landing, réponses de la conversation). Pur et partagé client/serveur.
 *
 * Classification par mots-clés étendus, en deux niveaux :
 *  - signaux FORTS (le métier est nommé : « plombier », « DJ », « développeuse »)
 *  - signaux FAIBLES (le contexte : « chantier », « concert », « shooting »)
 * Insensible aux accents et à la casse ; le signal peut apparaître n'importe
 * où dans le texte ([2.3] — c'est lui qui déclenche le routing, pas l'ordre
 * de saisie).
 *
 * Verdict :
 *  - "high"  → score net et sans rival : on peut router directement ;
 *  - "low"   → un signal existe mais ambigu : POSER LA QUESTION de
 *              confirmation ([2.2] — jamais de routage silencieux douteux) ;
 *  - "none"  → aucun signal : demander le métier.
 */
import type { CategoryId } from "@/lib/categories";

export type DetectConfidence = "high" | "low" | "none";

export type DetectResult = {
  categoryId: CategoryId | null;
  confidence: DetectConfidence;
  scores: Record<CategoryId, number>;
};

/** Retire les diacritiques et passe en minuscules (« Électricien » → « electricien »). */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

const STRONG = 3;
const WEAK = 1;

/**
 * Lexique par catégorie (formes normalisées, sans accents). Les entrées
 * mono-mot sont cherchées en mot entier ; les expressions en sous-chaîne.
 * Liste volontairement extensible — l'ajout d'un métier = une ligne.
 */
const LEXICON: Record<CategoryId, { strong: string[]; weak: string[] }> = {
  photographe: {
    strong: [
      "photographe",
      "photographie",
      "videaste",
      "shooting",
      "seance photo",
      "seances photo",
      "reportage photo",
      "photo de mariage",
      "photos de mariage",
    ],
    weak: ["photo", "photos", "portrait", "portraits", "argentique", "retouche"],
  },
  musicien: {
    strong: [
      "musicien",
      "musicienne",
      "chanteur",
      "chanteuse",
      "dj",
      "deejay",
      "rappeur",
      "rappeuse",
      "beatmaker",
      "compositeur",
      "compositrice",
      "auteur-compositeur",
      "guitariste",
      "pianiste",
      "batteur",
      "bassiste",
      "violoniste",
      "saxophoniste",
      "trompettiste",
      "groupe de musique",
      "groupe de rock",
      "producteur de musique",
      "artiste musical",
      "orchestre",
    ],
    weak: [
      "musique",
      "concert",
      "concerts",
      "album",
      "spotify",
      "soundcloud",
      "deezer",
      "clip",
      "clips",
      "festival",
      "festivals",
      "platines",
      "mix",
      "sets",
      "scene",
      "techno",
      "electro",
      "jazz",
      "rock",
      "rap",
      "hip-hop",
      "hiphop",
      "booking",
    ],
  },
  artisan: {
    strong: [
      "artisan",
      "artisane",
      "plombier",
      "plombiere",
      "electricien",
      "electricienne",
      "menuisier",
      "menuisiere",
      "macon",
      "maconne",
      "peintre en batiment",
      "carreleur",
      "couvreur",
      "chauffagiste",
      "serrurier",
      "paysagiste",
      "jardinier",
      "jardiniere",
      "ebeniste",
      "charpentier",
      "plaquiste",
      "vitrier",
      "terrassier",
      "facadier",
      "plomberie",
      "electricite generale",
      "menuiserie",
      "maconnerie",
      "entreprise de nettoyage",
      "societe de nettoyage",
      "femme de menage",
      "homme toutes mains",
    ],
    weak: [
      "chantier",
      "chantiers",
      "devis",
      "renovation",
      "renovations",
      "depannage",
      "travaux",
      "installation",
      "pose",
      "rge",
      "qualibat",
      "intervention",
      "interventions",
    ],
  },
  portfolio: {
    strong: [
      "developpeur",
      "developpeuse",
      "designer",
      "graphiste",
      "architecte",
      "redacteur",
      "redactrice",
      "illustrateur",
      "illustratrice",
      "webdesigner",
      "motion designer",
      "directeur artistique",
      "directrice artistique",
      "data scientist",
      "ux designer",
      "ui designer",
      "product designer",
      "consultant",
      "consultante",
      "copywriter",
    ],
    weak: [
      "portfolio",
      "freelance",
      "github",
      "behance",
      "dribbble",
      "projets",
      "cv",
      "code",
      "react",
      "design",
    ],
  },
  saas: {
    strong: [
      "saas",
      "startup",
      "start-up",
      "logiciel",
      "application mobile",
      "application web",
      "app mobile",
      "notre application",
      "notre app",
      "notre plateforme",
    ],
    weak: ["abonnement", "essai gratuit", "utilisateurs", "api", "plateforme", "app"],
  },
};

const CATEGORY_IDS = Object.keys(LEXICON) as CategoryId[];

/** Vrai si `term` apparaît dans `text` (mot entier si mono-mot, sinon sous-chaîne). */
function matches(text: string, term: string): boolean {
  if (term.includes(" ") || term.includes("-")) return text.includes(term);
  return new RegExp(`(^|[^a-z0-9])${term}($|[^a-z0-9])`).test(text);
}

/** Analyse un texte libre et renvoie la catégorie la plus probable + confiance. */
export function detectCategory(text: string): DetectResult {
  const t = normalize(text ?? "");
  const scores = Object.fromEntries(CATEGORY_IDS.map((c) => [c, 0])) as Record<
    CategoryId,
    number
  >;

  if (t.trim().length >= 2) {
    for (const cat of CATEGORY_IDS) {
      const { strong, weak } = LEXICON[cat];
      for (const term of strong) if (matches(t, term)) scores[cat] += STRONG;
      for (const term of weak) if (matches(t, term)) scores[cat] += WEAK;
    }
  }

  const ranked = CATEGORY_IDS.slice().sort((a, b) => scores[b] - scores[a]);
  const best = ranked[0];
  const bestScore = scores[best];
  const secondScore = scores[ranked[1]];

  if (bestScore === 0) return { categoryId: null, confidence: "none", scores };
  if (bestScore >= STRONG && bestScore - secondScore >= 2) {
    return { categoryId: best, confidence: "high", scores };
  }
  return { categoryId: best, confidence: "low", scores };
}
