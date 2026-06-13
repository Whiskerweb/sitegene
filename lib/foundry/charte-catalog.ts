// lib/foundry/charte-catalog.ts
// Description LISIBLE de chaque charte de la banque (vibes.ts), à destination du
// SÉLECTEUR Mistral : il ne crée aucune charte, il PIOCHE dans cette bibliothèque
// celles qui collent au client. `ambiance` = l'univers en une phrase ; `idealFor`
// = les métiers/contextes où la charte brille. Aucune couleur/font ici : la source
// de vérité reste vibes.ts. Toute VibeId DOIT avoir une entrée (typé Record).
import type { VibeId } from "./types";

export interface CharteMeta {
  /** L'univers de la charte en une phrase FR (couleurs dominantes + ressenti). */
  ambiance: string;
  /** Métiers / contextes où cette charte est la plus juste. */
  idealFor: string;
}

export const CHARTE_META: Record<VibeId, CharteMeta> = {
  // --- 6 DA historiques ---
  "warm-serif": {
    ambiance: "Atelier chaleureux : brun terre et corail, sérif arrondi, très humain.",
    idealFor: "coachs, bien-être, métiers de soin et de proximité.",
  },
  "sage-nature": {
    ambiance: "Sauge et lin : verts doux et beige naturel, apaisant et organique.",
    idealFor: "bien-être, coachs, naturopathes, yoga.",
  },
  "ocean-confiance": {
    ambiance: "Bleu de travail : bleu franc sur fond clair, net et fiable.",
    idealFor: "artisans, conseil, métiers techniques de confiance.",
  },
  "corail-studio": {
    ambiance: "Corail pop : corail et jaune solaire, énergique et créatif.",
    idealFor: "studios créatifs, beauté pop, restauration solaire.",
  },
  "mineral-precis": {
    ambiance: "Minéral précis : gris froid et indigo, minimal et premium.",
    idealFor: "artisans haut de gamme, conseil, studios fitness premium.",
  },
  "encre-editoriale": {
    ambiance: "Encre éditoriale : crème et or, Playfair, élégance littéraire intemporelle.",
    idealFor: "photographes, beauté, métiers raffinés.",
  },
  // --- 11 DA enrichies (Lot 1) ---
  "mindful-moments": {
    ambiance: "Vert profond et or sur fond sombre, sérif feutré, calme premium.",
    idealFor: "bien-être premium, coachs, méditation, thérapie.",
  },
  "lexicon-creators": {
    ambiance: "Sombre net, orange franc, Syne — orienté conversion et créateurs.",
    idealFor: "conseil, SaaS, créateurs, fitness orienté résultats.",
  },
  "auralis-neural": {
    ambiance: "Tech clair, indigo et cyan, panneau glow, crédibilité produit.",
    idealFor: "conseil, tech, SaaS, startups.",
  },
  "nexus-transfers": {
    ambiance: "Fintech chaleureuse : crème chaude et orange, données mises en valeur.",
    idealFor: "conseil, fintech, restauration esprit maison.",
  },
  "neurosync": {
    ambiance: "Feature net : blanc, grille, terracotta sobre, bento maîtrisé.",
    idealFor: "conseil, artisans, tech orientée clarté.",
  },
  "rock-brutalist": {
    ambiance: "Brutalist acide : noir et jaune toxique, Anton, énergie d'affiche.",
    idealFor: "musiciens rock/metal, fitness radical.",
  },
  "rap-luxe": {
    ambiance: "Luxe chrome : noir, or et chrome, contrastes maximaux, luxe-street.",
    idealFor: "musiciens rap/urbain, marques street premium.",
  },
  "contemporain-editorial": {
    ambiance: "Éditorial intime : crème chaude, Fraunces, sérif sensible et délicat.",
    idealFor: "musiciens folk/contemporains, photographes, beauté.",
  },
  "photographe-galerie": {
    ambiance: "Galerie froide : grège et encre, beaucoup d'air, l'image d'abord.",
    idealFor: "photographes, vidéastes, portfolios visuels.",
  },
  "coach-performance": {
    ambiance: "Industriel kinetic : noir et lime électrique, Bebas, preuve par les chiffres.",
    idealFor: "fitness, coachs sportifs, salles de sport.",
  },
  "restaurant-nocturne": {
    ambiance: "Nocturne : braise et or, Cormorant, ambiance de table aux bougies.",
    idealFor: "restaurants, bars, traiteurs gastronomiques.",
  },
  // --- 15 DA curées (Lot 2) ---
  "brume-marine": {
    ambiance: "Brume marine : bleus profonds apaisants, Fraunces, sérénité contemplative.",
    idealFor: "coachs, bien-être, conseil, métiers de confiance.",
  },
  "terre-eglantier": {
    ambiance: "Terre d'églantier : terracotta et rosé chaleureux, Playfair, bienveillant.",
    idealFor: "coachs, beauté, bien-être féminin.",
  },
  "serre-lumineuse": {
    ambiance: "Lumière de serre : verts tendres et diffus, Instrument Serif, vivifiant.",
    idealFor: "bien-être, coachs, naturopathie, photographes nature.",
  },
  "lin-poudre": {
    ambiance: "Lin poudré : beige lin et nude doux, Newsreader, feutré et délicat.",
    idealFor: "coachs, beauté, bien-être, instituts.",
  },
  "galerie-ivoire": {
    ambiance: "Galerie ivoire : ivoire et encre, Bricolage net, épuré et contemplatif.",
    idealFor: "photographes, beauté, galeries, portfolios.",
  },
  "noir-argentique": {
    ambiance: "Noir argentique : charbon et blanc cassé, dramatique, photo plein cadre.",
    idealFor: "photographes, vidéastes, musiciens, artistes.",
  },
  "sable-mineral": {
    ambiance: "Sable minéral : sable et ardoise, Space Grotesk, neutre et précis.",
    idealFor: "photographes, artisans, conseil, métiers premium sobres.",
  },
  "braise-cuivre": {
    ambiance: "Braise et cuivre : noir braisé et cuivre, Cormorant, gourmand et nocturne.",
    idealFor: "restaurants, bars, traiteurs, caves.",
  },
  "bistrot-creme": {
    ambiance: "Bistrot crème : crème et bordeaux, Playfair, convivial et maison.",
    idealFor: "restaurants de quartier, bistrots, boulangeries.",
  },
  "olive-table": {
    ambiance: "Table d'olive : vert olive et terre cuite, Fraunces, méditerranéen solaire.",
    idealFor: "restaurants méditerranéens, traiteurs, bien-être naturel.",
  },
  "volt-graphite": {
    ambiance: "Volt graphite : graphite et orange volt, Archivo, industriel et énergique.",
    idealFor: "fitness, salles de sport, conseil qui s'affirme.",
  },
  "arena-rouge": {
    ambiance: "Arena rouge : noir et rouge sang, Anton, radical et intense.",
    idealFor: "fitness, sport de combat, musiciens rock.",
  },
  "ardoise-azur": {
    ambiance: "Ardoise azur : ardoise et bleu azur, Geist, clair et structuré.",
    idealFor: "conseil, tech, artisans, métiers techniques fiables.",
  },
  "rose-chrome": {
    ambiance: "Rose chrome : noir et rose chromé, Syne, raffiné et actuel.",
    idealFor: "beauté pointue, musiciens pop, marques mode.",
  },
  "acier-brique": {
    ambiance: "Acier et brique : bleu acier et brique, Space Grotesk, fiable et direct.",
    idealFor: "artisans, bâtiment, restauration brute, métiers de terrain.",
  },
};
