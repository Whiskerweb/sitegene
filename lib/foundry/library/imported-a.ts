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
  "fx-gooey-pixel-trail": M({
    id: "fx-gooey-pixel-trail",
    role: "statement",
    rarity: "epic",
    description:
      "Phrase manifeste posée sur une image assombrie, avec une TRAÎNÉE DE PIXELS qui suit le curseur et se fond en blobs organiques (filtre « gooey »). Effet d'attention interactif et mémorable.",
    whenToUse: ["moment d'attention fort au milieu d'une page", "affirmer une phrase manifeste sur une image", "site créatif/audacieux qui veut un effet curseur signature"],
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
};
