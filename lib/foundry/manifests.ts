// lib/foundry/manifests.ts
import type { ComponentManifest } from "./types";

export const MANIFESTS: Record<string, ComponentManifest> = {
  "hero-split-asym": {
    id: "hero-split-asym",
    role: "hero",
    description: "Hero 3 colonnes : accroche + preuve sociale (avatars) à gauche, grande photo au centre, mini-bloc + 2e photo à droite.",
    whenToUse: ["forte preuve sociale", "métier visuel/humain (coach, photographe, bien-être)", "hero riche premium"],
    vibes: ["warm-serif"],
    contentKeys: ["badge", "title", "subtitle", "cta", "proofCount", "proofLabel", "image", "image2", "avatars"],
    allowedSkinKeys: ["accent", "surface"],
  },
  "services-rows": {
    id: "services-rows",
    role: "services",
    description: "Liste de services en grandes lignes numérotées (numéro + titre + description), séparées par des filets.",
    whenToUse: ["présenter 3 à 6 offres", "métier orienté prestations (coach, artisan)"],
    vibes: ["warm-serif"],
    contentKeys: ["eyebrow", "title", "items"],
    allowedSkinKeys: ["accent", "surface"],
  },
  "testimonials-carousel": {
    id: "testimonials-carousel",
    role: "testimonials",
    description: "Carrousel de cartes-avis en défilement continu (marquee) : citation, avatar, nom, rôle.",
    whenToUse: ["au moins 3 témoignages clients", "renforcer la confiance"],
    vibes: ["warm-serif"],
    contentKeys: ["eyebrow", "title", "items"],
    allowedSkinKeys: ["accent", "surface"],
  },
  "footer-columns": {
    id: "footer-columns",
    role: "footer",
    description: "Footer en colonnes : marque + tagline, liens, contact ; barre basse copyright.",
    whenToUse: ["clôture de page (toujours)"],
    vibes: ["warm-serif"],
    contentKeys: ["brand", "tagline", "columns", "copyright"],
    allowedSkinKeys: ["surface"],
  },
};

export function getManifest(id: string): ComponentManifest | undefined {
  return MANIFESTS[id];
}
export function listManifests(): ComponentManifest[] {
  return Object.values(MANIFESTS);
}
