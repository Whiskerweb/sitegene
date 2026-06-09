// lib/foundry/manifests.ts
import type { ComponentManifest } from "./types";

export const MANIFESTS: Record<string, ComponentManifest> = {
  "hero-split-asym": {
    id: "hero-split-asym",
    role: "hero",
    rarity: "rare",
    description: "Hero 3 colonnes : accroche + preuve sociale (avatars) à gauche, grande photo au centre, mini-bloc + 2e photo à droite.",
    whenToUse: ["forte preuve sociale", "métier visuel/humain (coach, photographe, bien-être)", "hero riche premium"],
    vibes: ["warm-serif"],
    contentKeys: ["badge", "title", "subtitle", "cta", "proofCount", "proofLabel", "image", "image2", "avatars"],
    allowedSkinKeys: ["accent", "surface"],
  },
  "services-rows": {
    id: "services-rows",
    role: "services",
    rarity: "common",
    description: "Liste de services en grandes lignes numérotées (numéro + titre + description), séparées par des filets.",
    whenToUse: ["présenter 3 à 6 offres", "métier orienté prestations (coach, artisan)"],
    vibes: ["warm-serif"],
    contentKeys: ["eyebrow", "title", "items"],
    allowedSkinKeys: ["accent", "surface"],
  },
  "testimonials-carousel": {
    id: "testimonials-carousel",
    role: "reviews",
    rarity: "common",
    description: "Carrousel de cartes-avis en défilement continu (marquee) : citation, avatar, nom, rôle.",
    whenToUse: ["au moins 3 témoignages clients", "renforcer la confiance"],
    vibes: ["warm-serif"],
    contentKeys: ["eyebrow", "title", "items"],
    allowedSkinKeys: ["accent", "surface"],
  },
  "footer-columns": {
    id: "footer-columns",
    role: "footer",
    rarity: "common",
    description: "Footer en colonnes : marque + tagline, liens, contact ; barre basse copyright.",
    whenToUse: ["clôture de page (toujours)"],
    vibes: ["warm-serif"],
    contentKeys: ["brand", "tagline", "columns", "copyright"],
    allowedSkinKeys: ["surface"],
  },
  "reviews-postit-carousel": {
    id: "reviews-postit-carousel",
    role: "reviews",
    rarity: "rare",
    description: "Avis clients en marquee de « notes épinglées » : cartes blanches légèrement inclinées avec un pin coloré qui dépasse, sur un fond pinboard jaune doux. Citation, avatar, nom.",
    whenToUse: ["au moins 3 avis clients", "vouloir un bloc avis à fort parti pris design", "ambiance chaleureuse/créative"],
    vibes: ["warm-serif"],
    contentKeys: ["eyebrow", "title", "items"],
    allowedSkinKeys: ["accent", "surface"],
  },
  "faq-accordion": {
    id: "faq-accordion",
    role: "faq",
    rarity: "common",
    description: "FAQ en accordéon 2 colonnes : intro (éyebrow + titre) à gauche, questions dépliables à droite (icône + qui pivote, réponse en hauteur animée).",
    whenToUse: ["lever les objections avant conversion", "4 à 6 questions fréquentes"],
    vibes: ["warm-serif"],
    contentKeys: ["eyebrow", "title", "items"],
    allowedSkinKeys: ["accent", "surface"],
  },
  "cta-banner": {
    id: "cta-banner",
    role: "cta",
    rarity: "common",
    description: "Bandeau de conversion : panneau encre (image de fond optionnelle + voile), grande phrase Castoro et bouton pilule. Clôture de page.",
    whenToUse: ["pousser à l'action en fin de page", "rappeler le CTA principal"],
    vibes: ["warm-serif"],
    contentKeys: ["title", "cta"],
    allowedSkinKeys: ["accent", "surface"],
  },
  "logo-marquee": {
    id: "logo-marquee",
    role: "logos",
    rarity: "common",
    description: "Bandeau de confiance : noms/partenaires en défilement continu (marquee), discret et atténué.",
    whenToUse: ["afficher des partenaires / médias / clients", "preuve de confiance légère sous le hero"],
    vibes: ["warm-serif"],
    contentKeys: ["items"],
    allowedSkinKeys: ["surface"],
  },
  "pricing-cards": {
    id: "pricing-cards",
    role: "pricing",
    rarity: "common",
    description: "Tarifs en 3 cartes (une vedette en encre) : nom, prix, features à coches, bouton. Clair et lisible.",
    whenToUse: ["présenter des offres/forfaits", "page ou section tarifs"],
    vibes: ["warm-serif"],
    contentKeys: ["eyebrow", "title", "plans"],
    allowedSkinKeys: ["accent", "surface"],
  },
  "stats-countup": {
    id: "stats-countup",
    role: "stats",
    rarity: "rare",
    description: "Chiffres clés en grand, qui s'incrémentent de 0 à leur valeur à l'entrée dans l'écran (count-up au scroll).",
    whenToUse: ["preuve sociale chiffrée (clients, %, années)", "marquer la crédibilité"],
    vibes: ["warm-serif"],
    contentKeys: ["eyebrow", "title", "items"],
    allowedSkinKeys: ["accent", "surface"],
  },
};

export function getManifest(id: string): ComponentManifest | undefined {
  return MANIFESTS[id];
}
export function listManifests(): ComponentManifest[] {
  return Object.values(MANIFESTS);
}
