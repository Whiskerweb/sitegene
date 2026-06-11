// lib/foundry/da-personas.ts
// Affinité DA ↔ métier/sous-persona → classement par pertinence (onboarding).
// Déterministe, sans réseau. Toutes les vibes sont classées ; les mieux notées
// portent recommended=true. Une raison FR courte est rendue par DA.
import type { VibeId } from "./types";
import { VIBE_IDS } from "./vibes";

export type TradeId =
  | "coach" | "bien-etre" | "photographe" | "artisan" | "restaurant"
  | "beaute" | "conseil" | "musicien" | "fitness" | "autre";

/** Poids d'affinité d'une DA pour (trade, sous-persona). weight 0..100. */
interface Affinity { vibeId: VibeId; trade: TradeId; sub?: string; weight: number; reason: string }

export const DA_PERSONAS: Affinity[] = [
  // Musicien
  { vibeId: "rap-luxe", trade: "musicien", sub: "rap", weight: 95, reason: "Chrome et or sur noir : le luxe-street, streaming en avant." },
  { vibeId: "rock-brutalist", trade: "musicien", sub: "rock", weight: 95, reason: "Brutalist, jaune acide, dates qui défilent — énergie scène." },
  { vibeId: "contemporain-editorial", trade: "musicien", sub: "contemporain", weight: 95, reason: "Éditorial intime, sérif tendre, paroles mises en avant." },
  { vibeId: "rap-luxe", trade: "musicien", weight: 60, reason: "Présence forte pour un artiste qui s'affirme." },
  { vibeId: "rock-brutalist", trade: "musicien", weight: 55, reason: "Parti pris graphique fort, façon affiche." },
  { vibeId: "contemporain-editorial", trade: "musicien", weight: 55, reason: "Élégance sobre pour mettre la musique en avant." },
  // Photographe
  { vibeId: "photographe-galerie", trade: "photographe", weight: 95, reason: "Galerie froide, l'image d'abord, beaucoup d'air." },
  { vibeId: "encre-editoriale", trade: "photographe", weight: 70, reason: "Élégance de galerie, vos images priment." },
  { vibeId: "contemporain-editorial", trade: "photographe", weight: 65, reason: "Éditorial chaleureux pour un portfolio sensible." },
  // Restaurant
  { vibeId: "restaurant-nocturne", trade: "restaurant", weight: 95, reason: "Braise et or, ambiance de table à la lueur des bougies." },
  { vibeId: "corail-studio", trade: "restaurant", weight: 60, reason: "Gourmand et solaire : on a déjà faim." },
  { vibeId: "nexus-transfers", trade: "restaurant", weight: 50, reason: "Crème chaleureuse, esprit maison." },
  // Fitness / coach sportif
  { vibeId: "coach-performance", trade: "fitness", weight: 95, reason: "Industriel kinetic, lime électrique, preuve par les chiffres." },
  { vibeId: "lexicon-creators", trade: "fitness", weight: 55, reason: "Sombre et net, orienté conversion." },
  // Coach / bien-être
  { vibeId: "mindful-moments", trade: "bien-etre", weight: 90, reason: "Vert profond et or : la langue du bien-être premium." },
  { vibeId: "sage-nature", trade: "bien-etre", weight: 80, reason: "Végétal et lin, apaisant dès le premier écran." },
  { vibeId: "mindful-moments", trade: "coach", weight: 80, reason: "Calme premium, autorité douce." },
  { vibeId: "warm-serif", trade: "coach", weight: 75, reason: "Chaleur humaine pour un métier de confiance." },
  // Conseil / SaaS / tech
  { vibeId: "auralis-neural", trade: "conseil", weight: 85, reason: "Tech clair, panneau glow : crédibilité produit." },
  { vibeId: "neurosync", trade: "conseil", weight: 80, reason: "Feature clair et net, bento maîtrisé." },
  { vibeId: "lexicon-creators", trade: "conseil", weight: 78, reason: "Sombre orienté conversion (pricing, créateurs)." },
  { vibeId: "nexus-transfers", trade: "conseil", weight: 72, reason: "Fintech chaleureuse, données mises en valeur." },
  { vibeId: "ocean-confiance", trade: "conseil", weight: 70, reason: "Le bleu des marques de confiance." },
  // Artisan
  { vibeId: "ocean-confiance", trade: "artisan", weight: 85, reason: "Net et fiable, première impression d'un pro." },
  { vibeId: "mineral-precis", trade: "artisan", weight: 65, reason: "Précision d'atelier." },
  { vibeId: "neurosync", trade: "artisan", weight: 60, reason: "Clair et carré, devis lisibles." },
  // Beauté
  { vibeId: "encre-editoriale", trade: "beaute", weight: 80, reason: "Raffiné comme un salon haut de gamme." },
  { vibeId: "contemporain-editorial", trade: "beaute", weight: 72, reason: "Doux et éditorial." },
  { vibeId: "corail-studio", trade: "beaute", weight: 68, reason: "Pop et lumineux." },
];

export interface RankedVibe { vibeId: VibeId; weight: number; recommended: boolean; reason: string }

/** Raison générique de repli quand une DA n'a pas d'affinité explicite. */
const GENERIC_REASON = "Une base élégante, adaptable à votre activité.";

/**
 * Classe TOUTES les vibes pour un (trade, sous-persona) :
 * - score = max poids des affinités matching (sous-persona exact > trade seul) ;
 * - vibes sans affinité = poids 0 (restent listées, en bas) ;
 * - les 3 meilleures (poids > 0) reçoivent recommended=true.
 */
export function rankVibesForTrade(trade: TradeId, sub?: string): RankedVibe[] {
  const scored = VIBE_IDS.map((vibeId) => {
    const matches = DA_PERSONAS.filter((a) => a.vibeId === vibeId && a.trade === trade);
    let best: Affinity | undefined;
    let bestScore = -1;
    for (const m of matches) {
      const score = m.sub ? (m.sub === sub ? m.weight + 1000 : -1) : m.weight;
      if (score < 0) continue;
      if (score > bestScore) { bestScore = score; best = m; }
    }
    const weight = bestScore < 0 ? 0 : bestScore;
    return { vibeId, weight, reason: best?.reason ?? GENERIC_REASON, recommended: false };
  });
  scored.sort((a, b) => b.weight - a.weight);
  let rec = 0;
  for (const s of scored) { if (s.weight > 0 && rec < 3) { s.recommended = true; rec++; } }
  return scored;
}
