// lib/foundry/suggest.ts
// Proposition de directions artistiques à partir du pitch client (onboarding).
// Déterministe et instantané : détection du métier par mots-clés → 3 vibes
// ordonnées + raison affichable. Le client choisit (moment « Stitch ») ;
// l'agenceur Mistral ne décide JAMAIS de la DA.
import type { VibeId } from "./types";

export type TradeId =
  | "coach"
  | "bien-etre"
  | "photographe"
  | "artisan"
  | "restaurant"
  | "beaute"
  | "conseil"
  | "autre";

export interface VibeSuggestion {
  vibeId: VibeId;
  /** 1 phrase FR affichée sous la carte DA (« Pourquoi cette ambiance »). */
  reason: string;
}

const TRADE_KEYWORDS: Array<{ trade: TradeId; words: string[] }> = [
  { trade: "coach", words: ["coach", "coaching", "développement personnel", "thérapeute", "therapeute", "thérapie", "therapie", "hypnose", "psy", "accompagnement"] },
  { trade: "bien-etre", words: ["yoga", "bien-être", "bien etre", "massage", "sophrologie", "sophrologue", "naturopathe", "méditation", "meditation", "pilates", "reiki"] },
  { trade: "photographe", words: ["photographe", "photographie", "photo", "vidéaste", "videaste", "shooting", "mariage"] },
  { trade: "artisan", words: ["artisan", "plombier", "électricien", "electricien", "menuisier", "maçon", "macon", "peintre en bâtiment", "couvreur", "chauffagiste", "serrurier", "rénovation", "renovation", "btp", "paysagiste", "jardinier"] },
  { trade: "restaurant", words: ["restaurant", "traiteur", "chef", "cuisine", "pâtisserie", "patisserie", "boulangerie", "food", "café", "brunch"] },
  { trade: "beaute", words: ["coiffeur", "coiffure", "esthétique", "esthetique", "barbier", "onglerie", "maquillage", "institut de beauté", "spa", "tatoueur", "tatouage"] },
  { trade: "conseil", words: ["consultant", "conseil", "avocat", "notaire", "expert-comptable", "comptable", "agence", "freelance", "développeur", "developpeur", "architecte", "immobilier", "courtier", "formation", "formateur"] },
];

/** Détecte le métier dominant d'un pitch (insensible à la casse/aux accents courants). */
export function detectTrade(brief: string): TradeId {
  const text = ` ${brief.toLowerCase()} `;
  let best: { trade: TradeId; hits: number } = { trade: "autre", hits: 0 };
  for (const { trade, words } of TRADE_KEYWORDS) {
    const hits = words.reduce((n, w) => (text.includes(w) ? n + 1 : n), 0);
    if (hits > best.hits) best = { trade, hits };
  }
  return best.trade;
}

const SUGGESTIONS: Record<TradeId, VibeSuggestion[]> = {
  coach: [
    { vibeId: "warm-serif", reason: "Met de l'humain et de la chaleur dans un métier de confiance." },
    { vibeId: "sage-nature", reason: "Apaise dès le premier écran — idéal pour l'accompagnement." },
    { vibeId: "encre-editoriale", reason: "Pose une autorité douce, comme un cabinet établi." },
  ],
  "bien-etre": [
    { vibeId: "sage-nature", reason: "Le végétal et le lin parlent la langue du bien-être." },
    { vibeId: "warm-serif", reason: "Chaleur artisanale, parfaite pour un lieu qui prend soin." },
    { vibeId: "mineral-precis", reason: "Épure premium, façon studio de yoga contemporain." },
  ],
  photographe: [
    { vibeId: "encre-editoriale", reason: "Élégance de galerie : vos images d'abord, le reste s'efface." },
    { vibeId: "mineral-precis", reason: "Minimal précis — le portfolio respire." },
    { vibeId: "corail-studio", reason: "Pour un studio créatif qui assume la couleur." },
  ],
  artisan: [
    { vibeId: "ocean-confiance", reason: "Net et fiable : la première impression d'un pro du bâtiment." },
    { vibeId: "mineral-precis", reason: "Précision d'atelier, devis carré." },
    { vibeId: "warm-serif", reason: "Le côté main à l'ouvrage, atelier de quartier." },
  ],
  restaurant: [
    { vibeId: "corail-studio", reason: "Gourmand et solaire : on a déjà faim." },
    { vibeId: "warm-serif", reason: "Table chaleureuse, maison de famille." },
    { vibeId: "encre-editoriale", reason: "Carte élégante, esprit bistrot chic." },
  ],
  beaute: [
    { vibeId: "encre-editoriale", reason: "Raffiné comme un salon haut de gamme." },
    { vibeId: "corail-studio", reason: "Pop et lumineux, pour un salon qui a du peps." },
    { vibeId: "sage-nature", reason: "Douceur naturelle, soins clean." },
  ],
  conseil: [
    { vibeId: "ocean-confiance", reason: "Sérieux immédiat : le bleu des marques de confiance." },
    { vibeId: "mineral-precis", reason: "Premium discret, dossiers tenus au cordeau." },
    { vibeId: "encre-editoriale", reason: "L'autorité d'une maison établie." },
  ],
  autre: [
    { vibeId: "warm-serif", reason: "Chaleureuse et universelle : elle va bien à presque tout." },
    { vibeId: "ocean-confiance", reason: "Nette et rassurante, valeur sûre." },
    { vibeId: "corail-studio", reason: "Énergique, si vous voulez sortir du lot." },
  ],
};

/** 3 DA proposées pour un pitch, ordonnées (la 1re est la recommandation). */
export function suggestVibes(brief: string): VibeSuggestion[] {
  return SUGGESTIONS[detectTrade(brief)];
}
