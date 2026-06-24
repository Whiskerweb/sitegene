/**
 * Retour qualité EN TEMPS RÉEL de la description d'activité (étape « pitch » de
 * /creer). 100 % local, pur, instantané — aucun appel réseau. `diagnose(text)`
 * teste N critères par regex : chaque critère présent ajoute des points, chaque
 * critère absent ajoute une question dans `tips` (max 3 affichées). Sert à
 * gamifier la saisie (jauge + score + félicitations) et à guider sans bloquer.
 */

export type Tone = "red" | "amber" | "green";
export type Diagnosis = { score: number; label: string; tone: Tone; tips: string[] };

/** Minuscules + sans accents : les regex ci-dessous sont écrites sans accents. */
const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

/**
 * Critères, ORDONNÉS par importance (l'ordre détermine la priorité des `tips`).
 * Les `points` somment à 100. `test` reçoit le texte déjà normalisé.
 */
const CRITERIA: { key: string; points: number; test: (t: string) => boolean; tip: string }[] = [
  {
    key: "substance",
    points: 8,
    test: (t) => t.replace(/\s+/g, " ").trim().length >= 50,
    tip: "Décrivez votre activité en quelques phrases complètes.",
  },
  {
    key: "offres",
    points: 16,
    test: (t) => /\b(service|prestation|offre|propose|accompagn|seance|formule|cours|atelier|forfait|realis|installation|depannage|conseil|coaching|soin)\w*/.test(t),
    tip: "Quelles sont vos offres ou prestations concrètes ?",
  },
  {
    key: "public",
    points: 14,
    // Réponse ouverte → on détecte les TOURNURES ("j'accompagne…", "pour les…",
    // "auprès de…", "ma clientèle…") + un vocabulaire d'audience très large.
    test: (t) =>
      /(\baccompagn\w*|\bjaccompagn|\baide\w*|\baupres\b|\bdestine\w*|\bclientel\w*|\bmes clients?\b|\bje m'?adresse|\bje travaille (avec|pour|aupres)|\bje propose (a|aux)\b|\bpour (les|des|le|la|l'|un|une|mes|nos|toute|tous|ceux|celles|chaque|toi|vous)\b|\bs'?adresse\b)/.test(t) ||
      /\b(particulier|professionnel|entreprise|tpe|pme|debutant|famille|salarie|actif|dirigeant|couple|enfant|ado|adolescent|senior|femme|homme|jeune|maman|papa|parent|sportif|sportive|etudiant|entrepreneur|independant|freelance|artisan|commercant|cadre|manager|equipe|retraite|celibataire|client|clientele|public|cible)\w*/.test(t),
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
      /(\bregion\b|\bville\b|\bsecteur\b|\bzone\b|\bdomicile\b|\bvisio\b|\ben ligne\b|\balentour|\bdepartement\b|\bautour de\b|\b\d{5}\b|\b(?:paris|lyon|marseille|bordeaux|toulouse|nantes|lille|rennes|nice|strasbourg|montpellier|nancy|metz|grenoble|dijon|angers|reims|brest|tours|orleans)\b)/.test(t),
    tip: "Où intervenez-vous (ville, zone, à distance) ?",
  },
  {
    key: "differenciation",
    points: 11,
    // Réponse ouverte → tournures de distinction + vocabulaire de singularité.
    test: (t) =>
      /(\bdifferen\w*|\bunique\w*|\bparticularit\w*|\bspecialit\w*|\bspecialis\w*|\bapproche\w*|\bmethode\w*|\bcontrairement\b|\ba la difference\b|\bsur-?mesure\b|\bpersonnalis\w*|\b(ma|notre|sa) force\b|\bvaleur ajoutee\b|\bje me demarque\b|\b(me|nous) distingue\w*|\bce qui (me|nous|vous) distingue\b|\bmon petit plus\b|\ble petit plus\b|\bsignature\b|\bsavoir-?faire\b|\bexpertise\w*|\bphilosophie\b)/.test(t),
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

/** Fonction PURE : même entrée → même sortie, sans effet de bord ni réseau. */
export function diagnose(text: string): Diagnosis {
  const t = normalize(text);
  let score = 0;
  const tips: string[] = [];
  for (const c of CRITERIA) {
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
