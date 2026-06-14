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
  { vibeId: "mineral-precis", trade: "fitness", weight: 48, reason: "Premium et précis, pour un studio haut de gamme." },
  // Coach / bien-être
  { vibeId: "mindful-moments", trade: "bien-etre", weight: 90, reason: "Vert profond et or : la langue du bien-être premium." },
  { vibeId: "sage-nature", trade: "bien-etre", weight: 80, reason: "Végétal et lin, apaisant dès le premier écran." },
  { vibeId: "warm-serif", trade: "bien-etre", weight: 72, reason: "Chaleureuse et humaine, pour un lieu qui prend soin." },
  { vibeId: "mindful-moments", trade: "coach", weight: 80, reason: "Calme premium, autorité douce." },
  { vibeId: "warm-serif", trade: "coach", weight: 75, reason: "Chaleur humaine pour un métier de confiance." },
  { vibeId: "sage-nature", trade: "coach", weight: 70, reason: "Apaisant et naturel, pour un accompagnement en douceur." },
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

  // --- Lot 2 : affinités des 15 DA curées (≥6 options par métier) ----------
  // Coach
  { vibeId: "brume-marine", trade: "coach", weight: 78, reason: "Bleus profonds, l'autorité douce d'un accompagnement." },
  { vibeId: "terre-eglantier", trade: "coach", weight: 74, reason: "Terracotta chaleureux, bienveillance pour des sujets intimes." },
  { vibeId: "serre-lumineuse", trade: "coach", weight: 72, reason: "Verts tendres, un espace de croissance et de confiance." },
  { vibeId: "lin-poudre", trade: "coach", weight: 66, reason: "Nude feutré, la douceur premium d'un cabinet." },
  // Bien-être
  { vibeId: "serre-lumineuse", trade: "bien-etre", weight: 82, reason: "Lumière de serre, fraîcheur vivifiante du soin." },
  { vibeId: "brume-marine", trade: "bien-etre", weight: 76, reason: "Apaisant et profond, comme une respiration." },
  { vibeId: "lin-poudre", trade: "bien-etre", weight: 70, reason: "Tons lin et nude, un cocon sensoriel." },
  { vibeId: "olive-table", trade: "bien-etre", weight: 60, reason: "Naturel méditerranéen, matières vivantes." },
  // Photographe
  { vibeId: "galerie-ivoire", trade: "photographe", weight: 90, reason: "Ivoire de galerie, l'image d'abord, beaucoup d'air." },
  { vibeId: "noir-argentique", trade: "photographe", weight: 85, reason: "Charbon argentique, vos tirages en pleine lumière." },
  { vibeId: "sable-mineral", trade: "photographe", weight: 60, reason: "Neutre minéral, sobre, ne concurrence pas l'image." },
  // Restaurant
  { vibeId: "braise-cuivre", trade: "restaurant", weight: 90, reason: "Braise et cuivre, table à la lueur des bougies." },
  { vibeId: "bistrot-creme", trade: "restaurant", weight: 82, reason: "Crème et bordeaux, esprit bistrot de quartier." },
  { vibeId: "olive-table", trade: "restaurant", weight: 78, reason: "Olive et terre cuite, cuisine du marché." },
  // Fitness
  { vibeId: "volt-graphite", trade: "fitness", weight: 88, reason: "Graphite et orange volt, l'énergie d'une salle." },
  { vibeId: "arena-rouge", trade: "fitness", weight: 80, reason: "Noir et rouge sang, l'intensité de l'effort." },
  { vibeId: "rock-brutalist", trade: "fitness", weight: 50, reason: "Brutalist acide, percussion visuelle." },
  // Conseil / tech
  { vibeId: "ardoise-azur", trade: "conseil", weight: 82, reason: "Ardoise et azur, le bleu de la crédibilité." },
  { vibeId: "sable-mineral", trade: "conseil", weight: 64, reason: "Neutre minéral, rapport clair et premium." },
  { vibeId: "brume-marine", trade: "conseil", weight: 60, reason: "Marine posée, confiance et sérieux." },
  { vibeId: "volt-graphite", trade: "conseil", weight: 55, reason: "Sombre énergique, un produit qui s'affirme." },
  // Artisan
  { vibeId: "acier-brique", trade: "artisan", weight: 84, reason: "Acier et brique, le sérieux d'un homme de métier." },
  { vibeId: "sable-mineral", trade: "artisan", weight: 66, reason: "Minéral précis, devis carrés et lisibles." },
  { vibeId: "ardoise-azur", trade: "artisan", weight: 62, reason: "Bleu net, première impression d'un pro fiable." },
  // Beauté
  { vibeId: "galerie-ivoire", trade: "beaute", weight: 76, reason: "Ivoire épuré, le raffinement d'un salon haut de gamme." },
  { vibeId: "lin-poudre", trade: "beaute", weight: 74, reason: "Nude poudré, douceur et soin." },
  { vibeId: "terre-eglantier", trade: "beaute", weight: 70, reason: "Rosé chaleureux, féminin et délicat." },
  { vibeId: "rose-chrome", trade: "beaute", weight: 66, reason: "Noir et rose chromé, une beauté actuelle et pointue." },
  // Musicien
  { vibeId: "noir-argentique", trade: "musicien", weight: 70, reason: "Charbon dramatique, façon artwork d'album." },
  { vibeId: "arena-rouge", trade: "musicien", sub: "rock", weight: 90, reason: "Noir et rouge, le mur du son d'une scène rock." },
  { vibeId: "arena-rouge", trade: "musicien", weight: 65, reason: "Rouge sang brutal, énergie de scène." },
  { vibeId: "rose-chrome", trade: "musicien", weight: 58, reason: "Noir et rose chromé, une pop affirmée." },
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
