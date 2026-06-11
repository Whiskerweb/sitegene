// lib/foundry/library/sections-a.ts
// LOT « sections-a » — sections importées de l'extérieur, réécrites aux
// conventions de la fonderie (CSS vars, CSS/DOM léger, pas de react-icons/
// framer-motion/cn). Rôles variés (team, highlights, contact, gallery).
import type { ComponentManifest } from "../types";
import { VIBE_IDS } from "../vibes";

const M = (m: Omit<ComponentManifest, "vibes" | "allowedSkinKeys">): ComponentManifest => ({
  ...m,
  vibes: VIBE_IDS,
  allowedSkinKeys: ["accent", "surface"],
});

const IMG = "/_templates/sereenity/media";

export const manifests: Record<string, ComponentManifest> = {
  "team-showcase": M({
    id: "team-showcase",
    role: "team",
    rarity: "rare",
    description:
      "L'équipe en VITRINE : 3 colonnes de photos décalées (noir & blanc → couleur au survol, les autres s'estompent) + liste de noms à droite qui révèle les réseaux au survol. Modulable (1 à N membres).",
    whenToUse: ["équipe / collectif / agence avec plusieurs visages", "présentation d'équipe à fort parti pris graphique", "page à propos / qui sommes-nous"],
    contentKeys: ["eyebrow", "title", "items"],
  }),
  "blog-cards": M({
    id: "blog-cards",
    role: "highlights",
    rarity: "common",
    description:
      "Grille d'ACTUALITÉS / articles : en-tête centré + cartes (image arrondie, titre, catégorie) qui se soulèvent au survol. Modulable, centrée.",
    whenToUse: ["blog / actualités / conseils / journal", "mettre en avant 3 à 6 contenus", "montrer une activité éditoriale"],
    contentKeys: ["eyebrow", "title", "subtitle", "items"],
  }),
  "social-clip-links": M({
    id: "social-clip-links",
    role: "contact",
    rarity: "rare",
    description:
      "Grille de LIENS (réseaux / contact) où, au survol, un calque accent se révèle en biais depuis le côté du curseur. Très graphique. Modulable.",
    whenToUse: ["inviter à suivre / contacter via les réseaux", "bloc « retrouvez-nous » à fort effet", "clôture de page créative"],
    contentKeys: ["eyebrow", "title", "items"],
  }),
  "expand-gallery": M({
    id: "expand-gallery",
    role: "gallery",
    rarity: "rare",
    description:
      "Galerie en RANGÉE EXTENSIBLE : l'image survolée s'agrandit, les autres se rétrécissent (transition fluide). Mobile = grille. Modulable (N images).",
    whenToUse: ["portfolio / réalisations / ambiance en images", "galerie interactive et ludique", "métier visuel (photographe, déco, food…)"],
    contentKeys: ["eyebrow", "title", "images"],
  }),
};

export const samples: Record<string, Record<string, unknown>> = {
  "team-showcase": {
    eyebrow: "L'équipe",
    title: "Les visages derrière le studio",
    items: [
      { name: "Camille Aubert", role: "Fondatrice", avatar: `${IMG}/coach.jpg`, linkedin: "#", x: "#" },
      { name: "Julien Mercier", role: "Direction artistique", avatar: `${IMG}/av2.jpg`, linkedin: "#" },
      { name: "Léa Fontan", role: "Relation clients", avatar: `${IMG}/av1.jpg`, instagram: "#" },
      { name: "Marc Lévy", role: "Développement", avatar: `${IMG}/trio2.jpg`, linkedin: "#", x: "#" },
      { name: "Hana Morel", role: "Photographe", avatar: `${IMG}/trio3.jpg`, instagram: "#" },
      { name: "David Roy", role: "Production", avatar: `${IMG}/trio1.jpg`, linkedin: "#" },
    ],
  },
  "blog-cards": {
    eyebrow: "Le journal",
    title: "Nos derniers articles",
    subtitle: "Conseils, coulisses et idées — pour aller plus loin avec nous.",
    items: [
      { image: `${IMG}/sess2.jpg`, title: "Bien préparer son projet : la checklist essentielle", category: "Conseils" },
      { image: `${IMG}/int4.jpg`, title: "Dans les coulisses de notre dernière création", category: "Coulisses" },
      { image: `${IMG}/still1.jpg`, title: "5 tendances à suivre cette année", category: "Inspiration" },
    ],
  },
  "social-clip-links": {
    eyebrow: "Restons en contact",
    title: "Retrouvez-nous",
    items: [
      { platform: "instagram", href: "#" },
      { platform: "linkedin", href: "#" },
      { platform: "x", href: "#" },
      { platform: "facebook", href: "#" },
      { platform: "mail", href: "#" },
    ],
  },
  "expand-gallery": {
    eyebrow: "Galerie",
    title: "Un aperçu en images",
    images: [`${IMG}/hero.jpg`, `${IMG}/sess2.jpg`, `${IMG}/int4.jpg`, `${IMG}/still1.jpg`, `${IMG}/hero2.jpg`, `${IMG}/sess3.jpg`, `${IMG}/still4.jpg`],
  },
};
