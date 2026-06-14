// lib/foundry/library/footers-a.ts
// LOT « footers-a » — pieds de page importés de l'extérieur, réécrits aux
// conventions de la fonderie (CSS vars, CSS pur, pas de GSAP/Next-Link/cn).
// Tous de rôle « footer » : alternatives à footer-columns.
import type { ComponentManifest } from "../types";
import { VIBE_IDS } from "../vibes";

const M = (m: Omit<ComponentManifest, "vibes" | "allowedSkinKeys">): ComponentManifest => ({
  ...m,
  vibes: VIBE_IDS,
  allowedSkinKeys: ["accent", "surface"],
});

export const manifests: Record<string, ComponentManifest> = {
  "footer-taped-card": M({
    id: "footer-taped-card",
    role: "footer",
    rarity: "rare",
    description:
      "(SaaS) Footer en CARTE arrondie « scotchée » (rubans dans les coins) : marque + accroche à gauche, colonnes de liens à droite, barre basse copyright + réseaux sociaux. Net et sympathique.",
    whenToUse: ["produit / SaaS / service avec plusieurs rubriques", "footer riche en liens, organisé en colonnes", "ton chaleureux et soigné"],
    contentKeys: ["brand", "tagline", "columns", "socials", "copyright"],
  }),
  "footer-giant-brand": M({
    id: "footer-giant-brand",
    role: "footer",
    rarity: "rare",
    description:
      "(Marque) Footer centré : pastille logo, marque, accroche, réseaux sociaux et rangée de liens — surmonté d'un TEXTE GÉANT de la marque en filigrane dégradé. Dramatique et épuré.",
    whenToUse: ["marque qui veut signer fort en bas de page", "footer minimal mais spectaculaire", "peu de liens, beaucoup d'impact"],
    contentKeys: ["brand", "tagline", "links", "socials", "copyright"],
  }),
  "footer-cinematic": M({
    id: "footer-cinematic",
    role: "footer",
    rarity: "epic",
    description:
      "(Cinématique) Footer SOMBRE spectaculaire : bandeau marquee incliné, halo lumineux, grande accroche, liens en pilules de verre, texte géant en filigrane, barre basse (copyright + « créé avec ❤ » + retour en haut).",
    whenToUse: ["clôture de page à fort impact (app, produit, marque audacieuse)", "footer immersif et premium", "donner envie de passer à l'action tout en bas"],
    contentKeys: ["heading", "brand", "words", "links", "copyright"],
  }),
};

export const samples: Record<string, Record<string, unknown>> = {
  "footer-taped-card": {
    brand: "Atelier Lumière",
    tagline: "Des sites soignés qui transforment vos visiteurs en clients.",
    columns: [
      { title: "Navigation", links: ["Accueil", "À propos", "Services", "Tarifs"] },
      { title: "Ressources", links: ["Réalisations", "Blog", "Contact"] },
      { title: "Légal", links: ["Mentions légales", "Confidentialité"] },
    ],
    socials: [
      { platform: "linkedin", href: "#" },
      { platform: "instagram", href: "#" },
      { platform: "x", href: "#" },
    ],
    copyright: "© Atelier Lumière. Tous droits réservés.",
  },
  "footer-giant-brand": {
    brand: "Nova",
    tagline: "On conçoit des expériences dont on se souvient.",
    links: ["Accueil", "Tarifs", "À propos", "Contact"],
    socials: [
      { platform: "x", href: "#" },
      { platform: "linkedin", href: "#" },
      { platform: "instagram", href: "#" },
    ],
    copyright: "© Nova. Tous droits réservés.",
  },
  "footer-cinematic": {
    heading: "Prêt à passer à l'action ?",
    brand: "Nova",
    words: ["Sur-mesure", "Transparent", "Fiable", "Proche de vous", "Soigné"],
    links: ["Confidentialité", "Conditions", "Support"],
    copyright: "© Nova. Tous droits réservés.",
  },
};
