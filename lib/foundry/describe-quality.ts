/**
 * Retour qualité EN TEMPS RÉEL de la description d'activité (étape « pitch » de
 * /creer). La DÉTECTION est 100 % locale, pure et instantanée — aucun appel
 * réseau dans `diagnose`. `diagnose(text, criteria)` teste N critères ; chaque
 * critère présent ajoute des points, chaque critère absent ajoute une question
 * dans `tips` (max 3 affichées). Retourne { score 0-100, label, tone, tips[] }.
 *
 * Les CRITÈRES, eux, peuvent venir de deux sources :
 *  - BASELINE_CRITERIA : générique, utilisé instantanément (avant l'IA / repli).
 *  - criteriaFromTopics(...) : critères SUR-MESURE par métier, générés par l'IA
 *    (un artiste, un plombier et un coach n'ont pas les mêmes questions), puis
 *    testés localement via leurs mots-clés. Le composant fait l'appel IA une
 *    seule fois et bascule du générique au sur-mesure.
 */

export type Tone = "red" | "amber" | "green";
export type Diagnosis = { score: number; label: string; tone: Tone; tips: string[] };
export type Criterion = { key: string; points: number; tip: string; test: (t: string) => boolean };

/** Minuscules + sans accents : les regex/mots-clés sont écrits sans accents. */
const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

/** Mots vides ignorés comme signal de détection (trop courants). */
const STOPWORDS = new Set([
  "pour", "qui", "avec", "comment", "dans", "sans", "les", "des", "une", "vos",
  "mon", "est", "plus", "etre", "fait", "tout", "tres", "bien",
]);

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Construit un test de détection à partir de mots-clés : match en DÉBUT de mot
 *  (gère les radicaux : "accompagn" → "accompagnement") pour éviter les faux
 *  positifs en sous-chaîne ("ans" dans "dans"). */
function keywordTest(keywords: string[]): (t: string) => boolean {
  const res = keywords
    .map((k) => normalize(k).trim())
    .filter((k) => k.length >= 3 && !STOPWORDS.has(k))
    .map((k) => new RegExp(`(^|[^a-z0-9])${escapeRegex(k)}`));
  return (t) => res.some((r) => r.test(t));
}

/** Toujours présent : une description trop courte ne peut pas scorer haut. */
const SUBSTANCE: Criterion = {
  key: "substance",
  points: 8,
  test: (t) => t.replace(/\s+/g, " ").trim().length >= 50,
  tip: "Décrivez votre activité en quelques phrases complètes.",
};

/**
 * Critères GÉNÉRIQUES (repli + affichage instantané avant la réponse IA).
 * Ordonnés par importance — l'ordre fixe la priorité des `tips`. Les `points`
 * somment à 100.
 */
export const BASELINE_CRITERIA: Criterion[] = [
  SUBSTANCE,
  {
    key: "offres",
    points: 16,
    test: (t) => /\b(service|prestation|offre|propose|accompagn|seance|formule|cours|atelier|forfait|realis|installation|depannage|conseil|coaching|soin|creation|oeuvre)\w*/.test(t),
    tip: "Quelles sont vos offres ou prestations concrètes ?",
  },
  {
    key: "public",
    points: 14,
    test: (t) =>
      /(\baccompagn\w*|\baide\w*|\baupres\b|\bdestine\w*|\bclientel\w*|\bmes clients?\b|\bje m'?adresse|\bje travaille (avec|pour|aupres)|\bpour (les|des|le|la|l'|un|une|mes|nos|toute|tous|ceux|celles)\b)/.test(t) ||
      /\b(particulier|professionnel|entreprise|tpe|pme|debutant|famille|salarie|actif|dirigeant|couple|enfant|ado|senior|femme|homme|jeune|maman|parent|sportif|etudiant|entrepreneur|independant|freelance|artisan|cadre|equipe|client|public|cible)\w*/.test(t),
    tip: "Pour qui travaillez-vous (votre clientèle) ?",
  },
  {
    key: "anciennete",
    points: 15,
    test: (t) => /(\bdepuis\b|\b\d+\s*ans?\b|\bannees?\b|\bexperience\b|\b(?:19|20)\d\d\b)/.test(t),
    tip: "Depuis combien de temps exercez-vous ?",
  },
  {
    key: "zone",
    points: 14,
    test: (t) =>
      /(\bregion\b|\bville\b|\bsecteur\b|\bzone\b|\bdomicile\b|\bvisio\b|\ben ligne\b|\balentour|\bdepartement\b|\bautour de\b|\b\d{5}\b|\b(?:paris|lyon|marseille|bordeaux|toulouse|nantes|lille|rennes|nice|strasbourg|montpellier|grenoble|dijon|angers|reims|brest|tours|orleans)\b)/.test(t),
    tip: "Où intervenez-vous (ville, zone, à distance) ?",
  },
  {
    key: "differenciation",
    points: 11,
    test: (t) =>
      /(\bdifferen\w*|\bunique\w*|\bparticularit\w*|\bspecialit\w*|\bspecialis\w*|\bapproche\w*|\bmethode\w*|\bcontrairement\b|\bsur-?mesure\b|\bpersonnalis\w*|\b(ma|notre|sa) force\b|\bvaleur ajoutee\b|\b(me|nous) distingue\w*|\bsignature\b|\bsavoir-?faire\b|\bexpertise\w*)/.test(t),
    tip: "Qu'est-ce qui vous différencie des autres ?",
  },
  {
    key: "tarifs",
    points: 11,
    test: (t) => /(\btarif|\bprix|\beuro|€|\bforfait|a partir de|\bgratuit|\bdevis)\w*/.test(t),
    tip: "Donnez une idée de vos tarifs (ou « à partir de »).",
  },
  {
    key: "preuves",
    points: 11,
    test: (t) => /\b(resultat|temoignage|avis|certifi|diplom|reconnu|reussi|reussite|garantie|reference|recommand|etoile|note)\w*/.test(t),
    tip: "Des preuves : résultats, avis ou certifications ?",
  },
];

/**
 * Critères SUR-MESURE par métier (issus de l'IA). Chaque sujet = { tip, keywords }.
 * On garde « substance » en tête (toujours pertinent), puis on répartit le reste
 * des points sur les sujets de l'IA (par ordre d'importance). Détection locale
 * par mots-clés. Repli sur le générique si l'IA ne renvoie rien d'exploitable.
 */
export function criteriaFromTopics(topics: { tip: string; keywords: string[] }[]): Criterion[] {
  const valid = topics.filter(
    (t) => t && typeof t.tip === "string" && t.tip.trim() && Array.isArray(t.keywords) && t.keywords.length > 0,
  );
  if (valid.length === 0) return BASELINE_CRITERIA;
  const each = Math.round((100 - SUBSTANCE.points) / valid.length);
  const ai: Criterion[] = valid.map((t, i) => ({
    key: `ai-${i}`,
    points: each,
    tip: t.tip.trim(),
    test: keywordTest(t.keywords),
  }));
  return [SUBSTANCE, ...ai];
}

/** Fonction PURE : même (texte, critères) → même sortie, sans réseau. */
export function diagnose(text: string, criteria: Criterion[] = BASELINE_CRITERIA): Diagnosis {
  const t = normalize(text);
  let score = 0;
  const tips: string[] = [];
  for (const c of criteria) {
    if (c.test(t)) score += c.points;
    else tips.push(c.tip);
  }
  score = Math.max(0, Math.min(100, Math.round(score)));

  let tone: Tone;
  let label: string;
  if (score >= 70) {
    tone = "green";
    label = "Description au top";
  } else if (score >= 40) {
    tone = "amber";
    label = "Ça prend forme";
  } else {
    tone = "red";
    label = "À étoffer";
  }

  return { score, label, tone, tips: tips.slice(0, 3) };
}
