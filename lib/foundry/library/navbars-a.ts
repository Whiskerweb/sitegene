// lib/foundry/library/navbars-a.ts
// LOT « navbars-a » — en-têtes extraits de tout le catalogue de templates
// (saas, e-learning, musiciens, photographes, portfolios, voyage). Regroupés
// par TYPE DE SECTION (et non par site source) car la demande portait sur « tous
// les header » : 9 archétypes STRUCTURELLEMENT distincts (les variantes qui ne
// changeaient que par la couleur/typo s'effondrent — la DA vient des CSS vars).
// Tous de rôle « navbar » : alternatives proposées à Mistral + à l'éditeur.
import type { ComponentManifest } from "../types";
import { VIBE_IDS } from "../vibes";

const M = (m: Omit<ComponentManifest, "vibes" | "allowedSkinKeys">): ComponentManifest => ({
  ...m,
  vibes: VIBE_IDS,
  allowedSkinKeys: ["accent", "surface"],
});

export const manifests: Record<string, ComponentManifest> = {
  "glass-pill-navbar": M({
    id: "glass-pill-navbar",
    role: "navbar",
    rarity: "rare",
    description:
      "(SaaS) En-tête en PILULE FLOTTANTE centrée, verre dépoli (translucide + flou) : pastille logo en dégradé, liens au centre, CTA pilule plein dégradé à droite. Léger et contemporain.",
    whenToUse: ["produit / app / SaaS moderne", "marque tech qui veut un en-tête léger et flottant", "site avec fond clair sous l'en-tête"],
    contentKeys: ["brand", "links", "cta"],
  }),
  "app-bar-navbar": M({
    id: "app-bar-navbar",
    role: "navbar",
    rarity: "common",
    description:
      "(SaaS) Barre pleine largeur nette : pastille logo ronde encre (anneau), liens sobres, CTA plein encre, menu hamburger sur mobile. Rassurant et lisible.",
    whenToUse: ["produit / service en ligne classique", "en-tête net qui inspire confiance", "site qui a besoin d'un menu mobile complet"],
    contentKeys: ["brand", "links", "cta"],
  }),
  "pill-menu-navbar": M({
    id: "pill-menu-navbar",
    role: "navbar",
    rarity: "rare",
    description:
      "(E-learning) Logo à pastille à gauche, LIENS REGROUPÉS DANS UNE PILULE pleine (encre, texte clair) au centre, CTA accent à droite. La pilule de liens est la signature.",
    whenToUse: ["plateforme / e-learning / service structuré", "ton accueillant et coloré", "marque qui veut un en-tête distinctif sans être chargé"],
    contentKeys: ["brand", "links", "cta"],
  }),
  "chip-links-navbar": M({
    id: "chip-links-navbar",
    role: "navbar",
    rarity: "rare",
    description:
      "(Voyage) Logo étoile, CHAQUE LIEN est une PUCE arrondie à contour qui s'allume en accent au survol, CTA accent généreux à droite. Chaleureux et coloré.",
    whenToUse: ["voyage / lifestyle / loisirs", "marque chaleureuse et colorée", "en-tête qui assume la couleur d'accent"],
    contentKeys: ["brand", "links", "cta"],
  }),
  "ink-bar-navbar": M({
    id: "ink-bar-navbar",
    role: "navbar",
    rarity: "common",
    description:
      "(Musicien) Barre ENCRE pleine, texte clair, liens discrets, CTA pilule à CONTOUR qui s'inverse au survol (fond clair / texte encre). En-tête sombre et premium.",
    whenToUse: ["musicien / photographe / club / marque nocturne", "site au ton sombre et premium", "en-tête contrasté posé en haut d'un univers visuel"],
    contentKeys: ["brand", "links", "cta"],
  }),
  "split-wordmark-navbar": M({
    id: "split-wordmark-navbar",
    role: "navbar",
    rarity: "rare",
    description:
      "(Musicien) Wordmark GÉANT centré, les liens répartis de part et d'autre (moitié à gauche, moitié à droite). En-tête symétrique à fort caractère.",
    whenToUse: ["artiste / musicien / marque à fort caractère", "en-tête symétrique et mémorable", "nom de marque court qu'on veut mettre en vedette"],
    contentKeys: ["brand", "links"],
  }),
  "studio-clock-navbar": M({
    id: "studio-clock-navbar",
    role: "navbar",
    rarity: "rare",
    description:
      "(Portfolio) En-tête éditorial ultra-minimal : wordmark et liens en CAPITALES espacées, HORLOGE LOCALE vivante à droite (heure du visiteur). Pointu et sobre.",
    whenToUse: ["portfolio créatif / studio / direction artistique", "ton éditorial minimal et pointu", "site qui mise sur la typographie plutôt que la couleur"],
    contentKeys: ["brand", "links"],
  }),
  "ticker-navbar": M({
    id: "ticker-navbar",
    role: "navbar",
    rarity: "rare",
    description:
      "(Événement) En-tête en BANDEAU DÉFILANT (marquee) : le nom et les liens passent en boucle continue, séparés par des points accent. Vivant et audacieux.",
    whenToUse: ["événement / groupe / festival / site éditorial audacieux", "en-tête vivant qui sort de la barre classique", "marque qui veut surprendre dès le haut de page"],
    contentKeys: ["brand", "links"],
  }),
  "wordmark-navbar": M({
    id: "wordmark-navbar",
    role: "navbar",
    rarity: "common",
    description:
      "(Photographe) Gros WORDMARK gras précédé d'un losange stylisé, liens en gras à droite, hamburger mobile qui se mue en croix + panneau déroulant arrondi. Typographique et affirmé.",
    whenToUse: ["photographe / créatif / marque qui assume son nom", "en-tête typographique minimal", "site clair qui veut un nom bien lisible en haut"],
    contentKeys: ["brand", "links"],
  }),
};

export const samples: Record<string, Record<string, unknown>> = {
  "glass-pill-navbar": {
    brand: "Northpeak",
    links: ["Fonctionnalités", "Intégrations", "Tarifs", "FAQ"],
    cta: "Demander une démo",
  },
  "app-bar-navbar": {
    brand: "Healix",
    links: ["Fonctionnalités", "Tarifs", "Avis"],
    cta: "Commencer gratuitement",
  },
  "pill-menu-navbar": {
    brand: "Elearni",
    links: ["Accueil", "Cours", "Méthode", "Tarifs"],
    cta: "S'inscrire",
  },
  "chip-links-navbar": {
    brand: "Voyageo",
    links: ["Accueil", "Destinations", "À propos", "Contact"],
    cta: "Réserver mon voyage",
  },
  "ink-bar-navbar": {
    brand: "Marina Cole",
    links: ["À propos", "Galerie", "Avis", "Contact"],
    cta: "Me contacter",
  },
  "split-wordmark-navbar": {
    brand: "Kairo",
    links: ["Sorties", "Concerts", "À propos", "Booking"],
  },
  "studio-clock-navbar": {
    brand: "Mörk Studio",
    links: ["Projets", "Studio", "Contact"],
  },
  "ticker-navbar": {
    brand: "Halcyon",
    links: ["Concerts", "Sorties", "Booking"],
  },
  "wordmark-navbar": {
    brand: "Potozon",
    links: ["Accueil", "Galerie", "À propos", "Contact"],
  },
};
