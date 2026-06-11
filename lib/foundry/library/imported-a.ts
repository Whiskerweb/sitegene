// lib/foundry/library/imported-a.ts
// LOT « imported-a » — composants venus de l'EXTÉRIEUR (briefs fournis, style
// 21st.dev / aceternity), réécrits aux conventions de la fonderie (CSS vars,
// CSS/rAF, pas de framer-motion). Réutilise la banque d'images sereenity.
import type { ComponentManifest } from "../types";
import { VIBE_IDS } from "../vibes";

const M = (m: Omit<ComponentManifest, "vibes" | "allowedSkinKeys">): ComponentManifest => ({
  ...m,
  vibes: VIBE_IDS,
  allowedSkinKeys: ["accent", "surface"],
});

const IMG = "/_templates/sereenity/media";

export const manifests: Record<string, ComponentManifest> = {
  "marquee-hero": M({
    id: "marquee-hero",
    role: "hero",
    rarity: "rare",
    description:
      "Hero plein écran centré : tagline en pilule, grand titre qui se révèle MOT À MOT, description, CTA, et un MARQUEE D'IMAGES inclinées en bas (fondu en dégradé) qui défile en boucle. Vitrine en mouvement.",
    whenToUse: ["métier très visuel avec beaucoup d'images (photographe, créateur de contenu, agence, studio)", "hero spectaculaire qui montre une galerie dès l'ouverture", "marque qui veut un effet vitrine animé"],
    contentKeys: ["tagline", "title", "description", "cta", "images"],
  }),
  // Effet gooey en HERO (plein écran, en tête de page).
  "fx-gooey-pixel-trail": M({
    id: "fx-gooey-pixel-trail",
    role: "hero",
    rarity: "epic",
    description:
      "Hero d'attention : grande phrase posée sur une image assombrie, avec une TRAÎNÉE DE PIXELS qui suit le curseur et se fond en blobs organiques (filtre « gooey »). Spectaculaire et interactif.",
    whenToUse: ["hero spectaculaire et interactif", "site créatif/audacieux qui veut un effet curseur signature dès l'ouverture", "accroche forte sur une image"],
    contentKeys: ["eyebrow", "text", "image"],
  }),
  // Même effet en SECTION (milieu de page) — « et à d'autres endroits ».
  "fx-gooey-banner": M({
    id: "fx-gooey-banner",
    role: "media",
    rarity: "epic",
    description:
      "Bandeau d'attention au MILIEU de la page : même effet « gooey » (traînée de pixels qui suit le curseur sur une image assombrie) avec une phrase manifeste. Respiration interactive entre deux sections.",
    whenToUse: ["moment d'attention fort au milieu d'une page", "affirmer une phrase sur une image, de façon interactive", "rythmer une page avec un effet curseur mémorable"],
    contentKeys: ["eyebrow", "text", "image"],
  }),
};

export const samples: Record<string, Record<string, unknown>> = {
  "marquee-hero": {
    tagline: "Rejoignez plus de 100 000 créateurs",
    title: "Des visuels qui captivent votre audience",
    description: "Donnez de l'élan à votre marque avec des contenus à fort impact, signés par notre équipe de créateurs.",
    cta: "Commencer",
    images: [`${IMG}/hero.jpg`, `${IMG}/sess2.jpg`, `${IMG}/int4.jpg`, `${IMG}/still1.jpg`, `${IMG}/hero2.jpg`, `${IMG}/sess3.jpg`, `${IMG}/still4.jpg`],
  },
  "fx-gooey-pixel-trail": {
    eyebrow: "Notre vision",
    text: "Donnez vie à vos idées",
    image: `${IMG}/hero.jpg`,
  },
  "fx-gooey-banner": {
    eyebrow: "Ce qui nous anime",
    text: "Créer des expériences dont on se souvient",
    image: `${IMG}/hero2.jpg`,
  },
};
