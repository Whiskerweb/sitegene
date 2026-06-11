// lib/foundry/library/sections-b.ts
// LOT « sections-b » — sections importées (galeries, avis, blog, lieux),
// réécrites aux conventions de la fonderie (CSS vars, CSS/rAF, pas de
// framer-motion/cn/react-icons). Rôles : gallery, reviews, highlights, contact.
import type { ComponentManifest } from "../types";
import { VIBE_IDS } from "../vibes";

const M = (m: Omit<ComponentManifest, "vibes" | "allowedSkinKeys">): ComponentManifest => ({
  ...m,
  vibes: VIBE_IDS,
  allowedSkinKeys: ["accent", "surface"],
});

const IMG = "/_templates/sereenity/media";

export const manifests: Record<string, ComponentManifest> = {
  "carousel-cards": M({
    id: "carousel-cards",
    role: "gallery",
    rarity: "rare",
    description:
      "Carrousel d'images avec flèches : au survol d'une carte, un volet de texte remonte par-dessus la photo. Défilement fluide (scroll-snap). Modulable.",
    whenToUse: ["réalisations / services illustrés avec une légende", "galerie navigable au clic", "raconter chaque image"],
    contentKeys: ["eyebrow", "title", "items"],
  }),
  "image-marquee": M({
    id: "image-marquee",
    role: "gallery",
    rarity: "common",
    description:
      "Bandeau d'images en défilement continu ; au survol une image se réduit et révèle son titre. Pause au survol. Modulable.",
    whenToUse: ["montrer beaucoup de visuels en mouvement", "ambiance / portfolio défilant", "métier visuel"],
    contentKeys: ["eyebrow", "title", "items"],
  }),
  "scroll-velocity-gallery": M({
    id: "scroll-velocity-gallery",
    role: "gallery",
    rarity: "rare",
    description:
      "Deux rangées d'images qui défilent en sens opposés et ACCÉLÈRENT avec la vitesse de défilement de la page. Dynamique et immersif. Modulable.",
    whenToUse: ["galerie immersive réactive au scroll", "métier visuel audacieux", "rythmer une longue page"],
    contentKeys: ["eyebrow", "title", "items"],
  }),
  "testimonials-marquee": M({
    id: "testimonials-marquee",
    role: "reviews",
    rarity: "rare",
    description:
      "Avis clients sur deux rangées qui défilent en sens opposés (pause au survol) : photo, nom, texte, étoiles. Sobre et rassurant. Modulable.",
    whenToUse: ["beaucoup d'avis à faire défiler", "preuve sociale en continu", "tous secteurs"],
    contentKeys: ["eyebrow", "title", "items"],
  }),
  "liquid-reviews-marquee": M({
    id: "liquid-reviews-marquee",
    role: "reviews",
    rarity: "epic",
    description:
      "Avis en défilement dans des cartes « verre liquide » (filtre de distorsion + reflets), étoiles. Effet premium et mémorable. Modulable.",
    whenToUse: ["bloc avis haut de gamme et spectaculaire", "marque premium / tech / design", "moment preuve sociale qui marque"],
    contentKeys: ["eyebrow", "title", "items"],
  }),
  "blog-posts": M({
    id: "blog-posts",
    role: "highlights",
    rarity: "rare",
    description:
      "Grille d'articles en cartes pleine-image (la 1re occupe 2×2), voile bas, étoiles + vues + catégorie, mot géant en filigrane derrière. Éditorial et fort.",
    whenToUse: ["blog / actualités mis en avant", "3 à 5 articles phares", "donner une présence forte au contenu"],
    contentKeys: ["title", "subtitle", "backgroundLabel", "items"],
  }),
  "location-cards": M({
    id: "location-cards",
    role: "contact",
    rarity: "rare",
    description:
      "Cartes de LIEUX (ville, adresse, photo, bouton itinéraire) avec inclinaison 3D au survol. Pour une section « où nous trouver ». Modulable.",
    whenToUse: ["plusieurs adresses / points de vente / agences", "section « où nous trouver »", "donner envie de venir sur place"],
    contentKeys: ["eyebrow", "title", "subtitle", "items"],
  }),
};

export const samples: Record<string, Record<string, unknown>> = {
  "carousel-cards": {
    eyebrow: "Réalisations",
    title: "Nos projets en images",
    items: [
      { image: `${IMG}/hero.jpg`, content: "Une refonte complète, du concept à la livraison — pensée pour convertir." },
      { image: `${IMG}/sess2.jpg`, content: "Identité visuelle et déclinaisons : une marque cohérente sur tous les supports." },
      { image: `${IMG}/int4.jpg`, content: "Direction artistique soignée, jusque dans le moindre détail." },
      { image: `${IMG}/still1.jpg`, content: "Photographie sur mesure pour raconter votre histoire." },
      { image: `${IMG}/hero2.jpg`, content: "Un accompagnement de A à Z, avec des délais tenus." },
    ],
  },
  "image-marquee": {
    eyebrow: "Galerie",
    title: "Notre univers en mouvement",
    items: [
      { image: `${IMG}/hero.jpg`, title: "Créer" },
      { image: `${IMG}/sess2.jpg`, title: "Concevoir" },
      { image: `${IMG}/int4.jpg`, title: "Réaliser" },
      { image: `${IMG}/still1.jpg`, title: "Soigner" },
      { image: `${IMG}/hero2.jpg`, title: "Livrer" },
      { image: `${IMG}/sess3.jpg`, title: "Accompagner" },
    ],
  },
  "scroll-velocity-gallery": {
    eyebrow: "En images",
    title: "Faites défiler",
    items: [
      { image: `${IMG}/hero.jpg` }, { image: `${IMG}/sess2.jpg` }, { image: `${IMG}/int4.jpg` }, { image: `${IMG}/still1.jpg` },
      { image: `${IMG}/hero2.jpg` }, { image: `${IMG}/sess3.jpg` }, { image: `${IMG}/still4.jpg` }, { image: `${IMG}/coach.jpg` },
    ],
  },
  "testimonials-marquee": {
    eyebrow: "Témoignages",
    title: "Ce que disent nos clients",
    items: [
      { name: "Émilie C.", role: "Cliente fidèle", avatar: `${IMG}/av1.jpg`, content: "Un accompagnement d'une justesse rare — chaque détail compte.", rating: 5 },
      { name: "Marc L.", role: "Chef d'entreprise", avatar: `${IMG}/av2.jpg`, content: "Réactif, créatif et professionnel : je recommande les yeux fermés.", rating: 5 },
      { name: "Hana M.", role: "Particulier", avatar: `${IMG}/trio3.jpg`, content: "On s'est sentis écoutés du premier rendez-vous à la livraison.", rating: 5 },
      { name: "David R.", role: "Directeur", avatar: `${IMG}/trio1.jpg`, content: "Le résultat dépasse tout ce qu'on avait imaginé.", rating: 5 },
      { name: "Léa F.", role: "Indépendante", avatar: `${IMG}/av3.jpg`, content: "Un suivi impeccable et un rendu qu'on admire chaque jour.", rating: 4 },
      { name: "Julien M.", role: "Gérant", avatar: `${IMG}/trio2.jpg`, content: "Du sérieux, des délais tenus, zéro mauvaise surprise.", rating: 5 },
    ],
  },
  "liquid-reviews-marquee": {
    eyebrow: "Ils nous recommandent",
    title: "La parole à nos clients",
    items: [
      { name: "Sarah J.", role: "Responsable produit", avatar: `${IMG}/av1.jpg`, content: "Une collaboration qui a transformé notre image. Vivement recommandé.", rating: 5 },
      { name: "Mike C.", role: "Développeur", avatar: `${IMG}/av2.jpg`, content: "Propre, moderne et incroyablement simple à utiliser.", rating: 5 },
      { name: "Emily D.", role: "Designer", avatar: `${IMG}/trio3.jpg`, content: "Cohérent et magnifique. J'adore l'attention portée aux détails.", rating: 5 },
      { name: "Alex R.", role: "Lead technique", avatar: `${IMG}/trio1.jpg`, content: "Documentation au top et vrai support. Un indispensable.", rating: 5 },
    ],
  },
  "blog-posts": {
    title: "Nos articles les plus lus",
    subtitle: "Conseils, coulisses et idées — le meilleur de notre contenu pour aller plus loin.",
    backgroundLabel: "BLOG",
    items: [
      { title: "Réussir la refonte de votre site", category: "Conseils", image: `${IMG}/hero.jpg`, views: 2180, readTime: 8, rating: 5 },
      { title: "Les coulisses de notre dernière création", category: "Coulisses", image: `${IMG}/sess2.jpg`, views: 1456, readTime: 12, rating: 4 },
      { title: "5 tendances design à suivre", category: "Inspiration", image: `${IMG}/int4.jpg`, views: 987, readTime: 6, rating: 4 },
    ],
  },
  "location-cards": {
    eyebrow: "Nous trouver",
    title: "Nos adresses",
    subtitle: "Passez nous voir — on vous accueille avec plaisir.",
    items: [
      { city: "Paris", address: "12 rue des Tilleuls, 75011 Paris", image: `${IMG}/int4.jpg`, directionsUrl: "#" },
      { city: "Lyon", address: "8 quai des Lumières, 69002 Lyon", image: `${IMG}/still1.jpg`, directionsUrl: "#" },
    ],
  },
};
