// lib/foundry/library/agency-a.ts
// LOT « agency-a » — sections signature du template creative-agency (Forge) :
// hero typo XXL à vignette showreel, pile de projets sticky, services en typo
// contour interactive, CTA à vignette-lettre. Réécrites aux conventions de la
// fonderie (CSS vars, animations CSS, useState léger, pas de framer-motion).
// Identité : panneaux ENCRE assumés quel que soit le mode de la vibe.
import type { ComponentManifest } from "../types";
import { VIBE_IDS } from "../vibes";

const M = (m: Omit<ComponentManifest, "vibes" | "allowedSkinKeys">): ComponentManifest => ({
  ...m,
  vibes: VIBE_IDS,
  allowedSkinKeys: ["accent", "surface"],
});

const IMG = "/_templates/creative-agency/img";

export const manifests: Record<string, ComponentManifest> = {
  "bold-type-hero": M({
    id: "bold-type-hero",
    role: "hero",
    rarity: "epic",
    description:
      "(Agency) Hero TYPO XXL : trois lignes en capitales condensées alignées à droite, révélées par remontée masquée ; une VIGNETTE showreel (image + play + durée) s'insère DANS le bloc typo. Barre méta (baseline / étoiles accent / promesse) au-dessus. Panneau encre.",
    whenToUse: [
      "studio créatif / agence / collectif au positionnement affirmé",
      "marque qui veut un slogan en vedette plutôt qu'une photo",
      "site audacieux, éditorial sombre, typographique",
    ],
    contentKeys: ["metaLeft", "metaRight", "titleLines", "showreelImage", "playLabel", "duration"],
  }),
  "sticky-stack-projects": M({
    id: "sticky-stack-projects",
    role: "gallery",
    rarity: "epic",
    description:
      "(Agency) PILE DE PROJETS STICKY : les cartes (image | méta année + catégorie + bouton) se recouvrent au scroll, décalées en alternance, devant deux MOTS GÉANTS en contour évidé qui restent sticky derrière. Effet waouh garanti au scroll. Modulable 2 à N projets.",
    whenToUse: [
      "portfolio de projets / réalisations / études de cas",
      "vouloir un bloc projets spectaculaire au scroll",
      "agence, studio, architecte, créatif",
    ],
    contentKeys: ["title", "items"],
  }),
  "outline-services-list": M({
    id: "outline-services-list",
    role: "services",
    rarity: "rare",
    description:
      "(Agency) SERVICES EN TYPO CONTOUR : noms en capitales géantes évidées, l'item actif se remplit au survol ; panneau sticky à droite avec l'image du service (crossfade) + liste « inclus » à coches accent. Interactif et typographique. Modulable 2 à N.",
    whenToUse: [
      "3 à 5 offres à présenter avec du caractère",
      "studio / agence / consultant premium",
      "remplacer une liste de services classique par un bloc signature",
    ],
    contentKeys: ["items"],
  }),
  "letter-tile-cta": M({
    id: "letter-tile-cta",
    role: "cta",
    rarity: "epic",
    description:
      "(Agency) CTA FINAL à VIGNETTE-LETTRE : phrase géante en capitales sur photo voilée sombre — dans la ligne marquée d'un « * », la lettre est remplacée par une petite image carrée insérée dans la typo. Bouton plein → accent au survol. Clôture spectaculaire.",
    whenToUse: [
      "clôture de page à fort impact",
      "marque créative qui veut une signature graphique mémorable",
      "remplacer un bandeau CTA classique",
    ],
    contentKeys: ["lines", "cta", "ctaHref"],
  }),
};

export const samples: Record<string, Record<string, unknown>> = {
  "bold-type-hero": {
    metaLeft: "Studio créatif — Paris",
    metaRight: "Des histoires qui laissent une trace",
    stars: 5,
    titleLines: ["DES MARQUES", "QUI", "MARQUENT"],
    showreelImage: `${IMG}/showreel.jpg`,
    playLabel: "VOIR LE SHOWREEL",
    duration: "01:42",
    ctaHref: "#contact",
  },
  "sticky-stack-projects": {
    title: "NOS PROJETS",
    bgWordLeft: "NOS",
    bgWordRight: "PROJETS",
    items: [
      { name: "BOTANICA", image: `${IMG}/work1.jpg`, year: "2026", category: "Identité & packaging", cta: "VOIR LE PROJET", href: "#contact" },
      { name: "MAISON VERDIER", image: `${IMG}/work2.jpg`, year: "2025", category: "Architecture d'intérieur", cta: "VOIR LE PROJET", href: "#contact" },
      { name: "ATELIER NORD", image: `${IMG}/work3.jpg`, year: "2025", category: "Portfolio créatif", cta: "VOIR LE PROJET", href: "#contact" },
    ],
  },
  "outline-services-list": {
    items: [
      {
        n: "(01)",
        name: "STRATÉGIE DE MARQUE",
        image: `${IMG}/svc1.jpg`,
        includedLabel: "CE QUI EST INCLUS",
        included: ["Positionnement & architecture de marque", "Plateforme de marque & ton de voix", "Étude des publics & insights", "Cadres de messages clés"],
      },
      {
        n: "(02)",
        name: "IDENTITÉ VISUELLE",
        image: `${IMG}/svc2.jpg`,
        includedLabel: "CE QUI EST INCLUS",
        included: ["Logotype & système graphique", "Palette, typographies & iconographie", "Guidelines complètes d'usage", "Déclinaisons print & digital"],
      },
      {
        n: "(03)",
        name: "SITE & EXPÉRIENCE",
        image: `${IMG}/svc3.jpg`,
        includedLabel: "CE QUI EST INCLUS",
        included: ["Direction artistique web", "UX, maquettes & prototypes", "Développement sur-mesure", "Animations & micro-interactions"],
      },
    ],
  },
  "letter-tile-cta": {
    lines: ["BÂTISSONS", "QUELQUE CH*SE", "D'ICONIQUE"],
    tile: `${IMG}/tile.jpg`,
    image: `${IMG}/cta.jpg`,
    cta: "PARLONS-EN",
    ctaHref: "#contact",
  },
};
