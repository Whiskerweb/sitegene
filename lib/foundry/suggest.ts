// lib/foundry/suggest.ts
// Détection métier + sous-persona depuis le pitch (onboarding) → DA classées par
// pertinence (cf. da-personas). Déterministe, sans réseau. L'agenceur ne décide
// JAMAIS de la DA : le client choisit dans une liste triée.
import { rankVibesForTrade, type TradeId, type RankedVibe } from "./da-personas";

export type { TradeId } from "./da-personas";

export interface TradeDetection { trade: TradeId; sub?: string }

const TRADE_KEYWORDS: Array<{ trade: TradeId; words: string[] }> = [
  { trade: "musicien", words: ["musicien", "musique", "chanteur", "chanteuse", "rappeur", "rappeuse", "rap", "rock", "groupe", "band", "concert", "album", "single", "dj", "beatmaker", "artiste", "tournée", "tournee", "scène", "scene"] },
  { trade: "fitness", words: ["salle de sport", "coach sportif", "coaching sportif", "fitness", "musculation", "crossfit", "personal trainer", "préparateur physique", "preparateur physique", "box", "studio de sport"] },
  { trade: "coach", words: ["coach", "coaching", "développement personnel", "developpement personnel", "thérapeute", "therapeute", "thérapie", "therapie", "hypnose", "psy", "accompagnement"] },
  { trade: "bien-etre", words: ["yoga", "bien-être", "bien etre", "massage", "sophrologie", "sophrologue", "naturopathe", "méditation", "meditation", "pilates", "reiki", "spa"] },
  { trade: "photographe", words: ["photographe", "photographie", "photo", "vidéaste", "videaste", "shooting", "mariage"] },
  { trade: "artisan", words: ["artisan", "plombier", "électricien", "electricien", "menuisier", "maçon", "macon", "peintre en bâtiment", "couvreur", "chauffagiste", "serrurier", "rénovation", "renovation", "btp", "paysagiste", "jardinier"] },
  { trade: "restaurant", words: ["restaurant", "traiteur", "chef", "cuisine", "pâtisserie", "patisserie", "boulangerie", "food", "café", "brunch", "bistrot", "table"] },
  { trade: "beaute", words: ["coiffeur", "coiffure", "esthétique", "esthetique", "barbier", "onglerie", "maquillage", "institut de beauté", "tatoueur", "tatouage"] },
  { trade: "conseil", words: ["consultant", "conseil", "avocat", "notaire", "expert-comptable", "comptable", "agence", "freelance", "développeur", "developpeur", "architecte", "immobilier", "courtier", "formation", "formateur", "saas", "startup", "logiciel", "application"] },
];

const SUB_KEYWORDS: Record<TradeId, Array<{ sub: string; words: string[] }>> = {
  musicien: [
    { sub: "rap", words: ["rap", "rappeur", "rappeuse", "hip-hop", "hip hop", "trap", "drill"] },
    { sub: "rock", words: ["rock", "groupe", "band", "métal", "metal", "punk", "garage", "guitare"] },
    { sub: "contemporain", words: ["chanteur", "chanteuse", "auteur", "compositeur", "pop", "folk", "intimiste", "acoustique", "variété", "variete"] },
  ],
  coach: [], "bien-etre": [], photographe: [], artisan: [], restaurant: [],
  beaute: [], conseil: [], fitness: [], autre: [],
};

function normalize(s: string): string { return ` ${s.toLowerCase()} `; }

/** Détecte le métier dominant + sous-persona éventuel. */
export function detectTrade(brief: string): TradeDetection {
  const text = normalize(brief);
  let best: { trade: TradeId; hits: number } = { trade: "autre", hits: 0 };
  for (const { trade, words } of TRADE_KEYWORDS) {
    const hits = words.reduce((n, w) => (text.includes(w) ? n + 1 : n), 0);
    if (hits > best.hits) best = { trade, hits };
  }
  const subs = SUB_KEYWORDS[best.trade] ?? [];
  let sub: string | undefined;
  let subHits = 0;
  for (const { sub: s, words } of subs) {
    const hits = words.reduce((n, w) => (text.includes(w) ? n + 1 : n), 0);
    if (hits > subHits) { subHits = hits; sub = s; }
  }
  return best.trade === "autre" ? { trade: "autre" } : { trade: best.trade, sub };
}

/** DA classées par pertinence pour un pitch (1re = recommandation). */
export function suggestVibes(brief: string): RankedVibe[] {
  const { trade, sub } = detectTrade(brief);
  return rankVibesForTrade(trade, sub);
}
