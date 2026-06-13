// lib/foundry/library/music-a.ts
// LOT « music-a » — sections extraites d'un template d'artiste/DJ (DA sombre,
// brute, typo condensée XXL, streaming-first), réécrites aux conventions de la
// fonderie (CSS vars, DOM léger, pas de react-icons/framer-motion/cn).
// Rôles : hero (drop), gallery (discographie), highlights (dates), statement
// (manifeste), cta (booking). Pensé pour les métiers musique/scène/nocturne.
import type { ComponentManifest } from "../types";
import { VIBE_IDS } from "../vibes";

const M = (m: Omit<ComponentManifest, "vibes" | "allowedSkinKeys"> & { allowedSkinKeys?: ComponentManifest["allowedSkinKeys"] }): ComponentManifest => ({
  ...m,
  vibes: VIBE_IDS,
  allowedSkinKeys: m.allowedSkinKeys ?? ["accent", "surface"],
});

const IMG = "/_templates/electronic-collective/img";
const DJ = "/_templates/dj-electro/img";

export const manifests: Record<string, ComponentManifest> = {
  "hero-drop": M({
    id: "hero-drop",
    role: "hero",
    rarity: "epic",
    description:
      "HERO « sortie » plein écran : image N&B + voile sombre, badge encadré, TITRE condensé XXL en capitales, et une barre de liens d'écoute pleine largeur en bas (Apple / Spotify / YouTube…). Très impactant, streaming-first. Modulable (1 à N plateformes).",
    whenToUse: ["annoncer une sortie / single / album en avant", "artiste, DJ, label, podcast à forte présence scénique", "univers sombre, club, nocturne, streetwear"],
    contentKeys: ["eyebrow", "title", "image", "platforms"],
    allowedSkinKeys: ["accent", "surface", "headingFont"],
  }),
  "release-grid": M({
    id: "release-grid",
    role: "gallery",
    rarity: "rare",
    description:
      "DISCOGRAPHIE en grille : libellé encadré + pochettes carrées (N&B → couleur au survol, voile « écouter » qui se révèle) avec titre + année. Modulable (2 à N sorties).",
    whenToUse: ["présenter des sorties / albums / singles / EP", "grille de pochettes ou de visuels carrés", "discographie, catalogue, playlist"],
    contentKeys: ["label", "items"],
  }),
  "tour-dates": M({
    id: "tour-dates",
    role: "highlights",
    rarity: "rare",
    description:
      "DATES / TOURNÉE : image de fond estompée, gros titre/hashtag, puis tableau Date / Ville / Salle avec un lien par ligne. Lignes qui s'accentuent au survol. Modulable (1 à N dates).",
    whenToUse: ["agenda de concerts / tournée / événements", "liste de dates à venir avec lieux", "artiste, DJ, salle, festival"],
    contentKeys: ["tag", "items"],
    allowedSkinKeys: ["accent", "surface", "headingFont"],
  }),
  "artist-statement": M({
    id: "artist-statement",
    role: "statement",
    rarity: "rare",
    description:
      "MANIFESTE / À PROPOS : portrait N&B + grande citation en capitales, suivie d'une rangée de pastilles de plateformes d'écoute. Parti pris éditorial fort. Modulable (0 à N plateformes).",
    whenToUse: ["bio courte à fort impact (citation / manifeste)", "présenter un artiste avec un portrait", "renvoyer vers les plateformes d'écoute"],
    contentKeys: ["label", "quote", "image", "platforms"],
  }),
  "booking-cta": M({
    id: "booking-cta",
    role: "cta",
    rarity: "rare",
    description:
      "CTA pleine largeur : image N&B + voile dégradé, eyebrow, TITRE condensé XXL, court texte et bouton accent (e-mail / lien). Clôture forte de page.",
    whenToUse: ["inviter à booker / réserver / contacter", "appel à l'action final immersif", "booking artiste, privatisation, demande de devis"],
    contentKeys: ["label", "title", "text", "cta"],
    allowedSkinKeys: ["accent", "surface", "headingFont"],
  }),
};

export const samples: Record<string, Record<string, unknown>> = {
  "hero-drop": {
    eyebrow: "New Drop",
    title: "“Nightform” is out now",
    image: `${DJ}/hero.jpg`,
    platforms: [
      { label: "Listen On Apple Music", href: "#" },
      { label: "Listen On Spotify", href: "#" },
      { label: "Listen On YouTube Music", href: "#" },
    ],
  },
  "release-grid": {
    label: "Releases",
    more: "View All",
    items: [
      { title: "Nightform", year: "2025", cover: `${IMG}/album1.jpg`, cta: "Listen Now", href: "#" },
      { title: "Concrete Pulse", year: "2025", cover: `${IMG}/album2.jpg`, cta: "Listen Now", href: "#" },
      { title: "Afterlight", year: "2025", cover: `${IMG}/album3.jpg`, cta: "Listen Now", href: "#" },
      { title: "Low Orbit", year: "2024", cover: `${IMG}/album4.jpg`, cta: "Listen Now", href: "#" },
    ],
  },
  "tour-dates": {
    tag: "#OnTour",
    more: "View All",
    image: `${IMG}/tour.jpg`,
    columns: { date: "Date", city: "City", venue: "Venue", explore: "Explore" },
    cta: "Learn More",
    items: [
      { date: "Apr 12", city: "Berlin, Germany", venue: "Kraftwerk, Mitte District", href: "#" },
      { date: "Apr 18", city: "London, United Kingdom", venue: "Village Underground, Shoreditch", href: "#" },
      { date: "Apr 25", city: "Paris, France", venue: "Le Trabendo, La Villette", href: "#" },
      { date: "May 07", city: "Amsterdam, Netherlands", venue: "Shelter, Overhoeks", href: "#" },
      { date: "May 14", city: "Milan, Italy", venue: "Tunnel Club, Via Sammartini", href: "#" },
    ],
  },
  "artist-statement": {
    label: "About",
    quote: "“Dark machines, late-night energy, no shortcuts — just the sound exactly as I hear it at 4 a.m.”",
    image: `${IMG}/bio2.jpg`,
    listenLabel: "Listen to Me On",
    platforms: [
      { label: "Apple Music", href: "#" },
      { label: "Spotify", href: "#" },
      { label: "YouTube Music", href: "#" },
      { label: "SoundCloud", href: "#" },
    ],
  },
  "booking-cta": {
    label: "Booking",
    title: "Book the night",
    text: "Clubs, festivals, private events — available worldwide for live sets and B2B. Send the date, the city and the room.",
    cta: "Get in Touch",
    email: "booking@example.com",
    image: `${DJ}/about.jpg`,
  },
};
