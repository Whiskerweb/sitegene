// lib/foundry/library/heroes-a.ts
// LOT « heroes-a » — HEROS extraits de nos templates (portfolio, musicien,
// mariage/photographe, artisans). Les composants existaient déjà (extraction
// antérieure) mais n'avaient jamais été câblés au catalogue : on les déclare ici
// (manifests + samples) pour que Mistral et l'éditeur puissent les proposer.
// Tous de rôle « hero » : alternatives au hero-split-asym par défaut.
import type { ComponentManifest } from "../types";
import { VIBE_IDS } from "../vibes";

const M = (m: Omit<ComponentManifest, "vibes" | "allowedSkinKeys">): ComponentManifest => ({
  ...m,
  vibes: VIBE_IDS,
  allowedSkinKeys: ["accent", "surface"],
});

export const manifests: Record<string, ComponentManifest> = {
  "creative-portfolio-hero": M({
    id: "creative-portfolio-hero",
    role: "hero",
    rarity: "rare",
    description:
      "(Portfolio) Hero plein écran sombre : NOM géant en deux lignes (pleine puis contour évidé), tagline discrète en bas. Typographie XXL, sans image.",
    whenToUse: ["portfolio créatif / freelance / artiste", "mettre le NOM en vedette", "site sombre minimal et typographique"],
    contentKeys: ["brand", "brand_last", "tagline"],
  }),
  "studio-portfolio-hero": M({
    id: "studio-portfolio-hero",
    role: "hero",
    rarity: "rare",
    description:
      "(Studio) Hero éditorial sombre : phrase d'accroche medium, bandeau de 3 tags blanc sur noir, puis WORDMARK géant en bas. Pointu et graphique.",
    whenToUse: ["studio créatif / agence / direction artistique", "hero éditorial typographique", "afficher des domaines d'expertise (tags)"],
    contentKeys: ["headline", "tags", "wordmark"],
  }),
  "jazz-vocalist-hero": M({
    id: "jazz-vocalist-hero",
    role: "hero",
    rarity: "rare",
    description:
      "(Musicien) Hero plein écran photo NOIR & BLANC, voile dégradé encre, nom en grand sérif centré, labels en bas (lieu / format).",
    whenToUse: ["musicien / artiste / marque intimiste", "hero photo immersif noir & blanc", "mettre une identité en vedette sur une image forte"],
    contentKeys: ["eyebrow", "title", "tagline", "leftLabel", "rightLabel", "image"],
  }),
  "luxury-wedding-hero": M({
    id: "luxury-wedding-hero",
    role: "hero",
    rarity: "rare",
    description:
      "(Mariage) Hero plein écran photo N&B, dégradé du bas, titre sur deux lignes en bas à gauche + tagline en bas à droite. Élégant et haut de gamme.",
    whenToUse: ["photographe / mariage / métier haut de gamme", "hero photo plein écran sobre et chic", "laisser l'image parler"],
    contentKeys: ["titleLine1", "titleLine2", "tagline", "image"],
  }),
  "wedding-warm-hero": M({
    id: "wedding-warm-hero",
    role: "hero",
    rarity: "rare",
    description:
      "(Mariage) Hero plein écran photo, voile du bas, grand titre sérif sur deux lignes, tagline + CTA à contour en bas. Chaleureux.",
    whenToUse: ["photographe / mariage / famille", "hero photo plein écran avec appel à l'action", "ton chaleureux et naturel"],
    contentKeys: ["title1", "title2", "tagline", "cta", "image"],
  }),
  "electrician-pro-hero": M({
    id: "electrician-pro-hero",
    role: "hero",
    rarity: "rare",
    description:
      "(Artisan) Hero centré : pastille d'avis étoilés, grand titre, CTA accent, puis grande image arrondie pleine largeur avec badge flottant.",
    whenToUse: ["artisan / service avec preuve sociale (avis)", "hero rassurant avec photo de chantier", "métier d'intervention (électricien, plombier…)"],
    contentKeys: ["title", "tagline", "cta", "rating", "badge", "image"],
  }),
  "multi-trade-hero": M({
    id: "multi-trade-hero",
    role: "hero",
    rarity: "rare",
    description:
      "(Artisan) Hero SOMBRE plein écran sur image, dégradé latéral, titre + CTA à gauche, pilules de preuves (garanties) à droite.",
    whenToUse: ["artisan multi-services / BTP", "hero sombre qui inspire le sérieux", "mettre en avant des garanties / preuves chiffrées"],
    contentKeys: ["title", "tagline", "cta", "image", "pills"],
  }),
};

const T = "/_templates";

export const samples: Record<string, Record<string, unknown>> = {
  "creative-portfolio-hero": {
    brand: "Alex",
    brand_last: "Morgan",
    tagline: "Designer & directeur artistique — je façonne des marques et des interfaces qui marquent les esprits.",
  },
  "studio-portfolio-hero": {
    headline: "Nous concevons des identités et des sites qui font la différence.",
    tags: ["Design", "Développement", "Direction artistique"],
    wordmark: "Mörk",
  },
  "jazz-vocalist-hero": {
    eyebrow: "Chanteuse de jazz",
    title: "Marina Cole",
    tagline: "Une voix chaude et intemporelle, entre standards revisités et compositions originales.",
    leftLabel: "Paris, FR",
    rightLabel: "Live & studio",
    image: `${T}/jazz-vocalist/img/hero.jpg`,
  },
  "luxury-wedding-hero": {
    titleLine1: "Photographie",
    titleLine2: "de mariage",
    tagline: "Des images élégantes et intemporelles pour le plus beau jour de votre vie.",
    image: `${T}/luxury-wedding/img/hero.jpg`,
  },
  "wedding-warm-hero": {
    title1: "Capturer vos",
    title2: "instants précieux",
    tagline: "Une photographie chaleureuse et naturelle, fidèle à vos émotions.",
    cta: "Voir les prestations",
    image: `${T}/wedding-warm/img/hero.jpg`,
  },
  "electrician-pro-hero": {
    title: "Des solutions électriques fiables, partout chez vous",
    tagline: "Dépannage, mise aux normes, installation : une équipe certifiée et des délais tenus.",
    cta: "Prendre rendez-vous",
    rating: "4,8+",
    badge: "Intervention sous 24 h",
    image: `${T}/electrician-pro/img/hero.jpg`,
  },
  "multi-trade-hero": {
    title: "Tous vos travaux, un seul artisan de confiance",
    tagline: "Plomberie, électricité, rénovation : un interlocuteur unique, du devis à la livraison.",
    cta: "Demander un devis",
    image: `${T}/multi-trade/img/hero.jpg`,
    pills: ["Devis gratuit", "Artisans certifiés", "Garantie décennale"],
  },
};
