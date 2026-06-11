// lib/foundry/samples.ts
// Contenu d'échantillon par composant — sert aux aperçus du catalogue dashboard
// et à la route /foundry-preview/[id]. Couvre toutes les contentKeys de chaque manifest.
import type { Recipe } from "./types";
import { LIBRARY_SAMPLES } from "./library";

const M = "/_templates/sereenity/media";

const REVIEWS = [
  { text: "L'accompagnement a changé ma vie : j'ai enfin osé en parler.", name: "Émilie C.", role: "Accompagnement individuel", avatar: `${M}/av1.jpg` },
  { text: "Je me suis senti écouté et accompagné, sans jamais de jugement.", name: "Marc L.", role: "Séances en visio", avatar: `${M}/av2.jpg` },
  { text: "On m'a aidée à faire de la place à la douleur sans la laisser me définir.", name: "Hana M.", role: "Accompagnement du deuil", avatar: `${M}/av3.jpg` },
  { text: "Des outils concrets pour me reconstruire, en sécurité dès le premier jour.", name: "David R.", role: "Transition de vie", avatar: `${M}/av1.jpg` },
];

/** Échantillons du socle historique (extraction Sereenity). */
const CORE_SAMPLES: Record<string, Record<string, unknown>> = {
  "hero-split-asym": {
    badge: "4,9",
    title: "Retrouvez votre équilibre, une séance à la fois.",
    subtitle: "Un accompagnement chaleureux et sur-mesure pour traverser le stress, les doutes et les transitions de vie.",
    cta: "Prendre rendez-vous",
    ctaHref: "#tarifs",
    proofCount: "300+",
    proofLabel: "personnes déjà accompagnées",
    image: `${M}/hero.jpg`,
    image2: `${M}/hero2.jpg`,
    avatars: [`${M}/trio1.jpg`, `${M}/trio2.jpg`, `${M}/trio3.jpg`],
  },
  "services-rows": {
    eyebrow: "Mon accompagnement",
    title: "Comment je vous aide à avancer",
    items: [
      { n: "01", name: "Accompagnement individuel", desc: "Des séances en tête-à-tête pour apprivoiser le stress, l'anxiété ou une période de doute." },
      { n: "02", name: "Accompagnement de couple", desc: "Renouer le dialogue, reconstruire la confiance et traverser les tensions." },
      { n: "03", name: "Famille & parentalité", desc: "Un soutien pour les familles qui traversent un conflit ou un changement." },
    ],
  },
  "testimonials-carousel": { eyebrow: "Témoignages", title: "Vous n'êtes pas seul", items: REVIEWS },
  "reviews-postit-carousel": { eyebrow: "Témoignages", title: "Vous n'êtes pas seul", items: REVIEWS },
  "faq-accordion": {
    eyebrow: "Vos questions",
    title: "Les questions que l'on me pose souvent",
    items: [
      { q: "Comment se passe une première séance ?", a: "On fait connaissance en douceur ; vous racontez ce qui vous amène, à votre rythme." },
      { q: "Les séances sont-elles confidentielles ?", a: "Strictement. Tout ce qui se dit reste entre nous." },
      { q: "En présentiel ou en visio ?", a: "Les deux, avec le même soin et la même qualité d'écoute." },
      { q: "Et si je ne suis pas sûr d'en avoir besoin ?", a: "Le premier échange est sans engagement, pour y voir clair ensemble." },
    ],
  },
  "cta-banner": {
    title: "Votre cheminement commence par un premier pas : celui de tendre la main.",
    cta: "Prendre rendez-vous",
    ctaHref: "#contact",
    image: `${M}/int4.jpg`,
  },
  "footer-columns": {
    brand: "Sereenity",
    tagline: "Votre espace pour avancer, grandir et vous sentir compris.",
    columns: [
      { title: "Liens rapides", links: ["Accueil", "À propos", "Services", "Tarifs"] },
      { title: "Me contacter", links: ["bonjour@sereenity.fr", "+33 1 23 45 67 89", "12 rue des Tilleuls, Paris"] },
    ],
    socials: [],
    copyright: "© Sereenity. Tous droits réservés.",
  },
  "logo-marquee": {
    title: "Recommandée par",
    items: ["Psycho & Vous", "Mag Bien-être", "Radio Sérénité", "Le Cercle", "Présence", "Ancrage"],
  },
  "pricing-cards": {
    eyebrow: "Tarifs",
    title: "Des formules claires, sans surprise",
    plans: [
      { name: "Découverte", price: "49 €", period: "/séance", desc: "Pour faire un premier pas en douceur.", features: ["Une séance d'accompagnement", "En visio ou en présentiel", "Objectifs personnalisés", "Accès à l'espace client"], cta: "Réserver ma séance" },
      { name: "Évolution", price: "89 €", period: "/séance", featured: true, desc: "Le rythme idéal pour un vrai changement.", features: ["Accompagnement dédié", "En visio ou en présentiel", "Plan de progression sur-mesure", "Messagerie entre les séances"], cta: "Réserver ma séance" },
      { name: "Sérénité", price: "229 €", period: "/mois", desc: "Le suivi le plus complet.", features: ["Séances illimitées", "Soutien prioritaire", "Messagerie entre les séances", "Ligne d'écoute"], cta: "Réserver ma séance" },
    ],
  },
  "stats-countup": {
    eyebrow: "En quelques chiffres",
    title: "Un accompagnement qui change les choses",
    items: [
      { value: 500, suffix: "+", label: "personnes accompagnées" },
      { value: 92, suffix: "%", label: "ressentent un mieux dès 3 séances" },
      { value: 12, suffix: "", label: "ans d'expérience" },
      { value: 2000, suffix: "+", label: "séances en visio menées" },
    ],
  },
  "intro-split": {
    eyebrow: "Qui je suis",
    title: "Un accompagnement à hauteur d'humain",
    body: "Je vous reçois dans un cadre calme et confidentiel, sans jugement. Ensemble, à votre rythme, on dénoue ce qui pèse et on avance vers plus de clarté.",
    image: `${M}/coach.jpg`,
    points: ["12 ans d'expérience", "Présentiel & visio", "Sans jugement, à votre rythme"],
  },
  "process-steps": {
    eyebrow: "Le chemin",
    title: "Comment ça se passe",
    steps: [
      { n: "01", title: "Premier échange", desc: "Un appel offert de 20 minutes pour faire connaissance et cerner votre besoin." },
      { n: "02", title: "La séance", desc: "En présentiel ou en visio, un cadre où vous êtes pleinement entendu." },
      { n: "03", title: "Des progrès concrets", desc: "On repère vos schémas, on bâtit votre résilience, pas à pas." },
    ],
  },
  "contact-block": {
    eyebrow: "Contact",
    title: "Parlons de ce qui vous amène",
    email: "bonjour@sereenity.fr",
    phone: "+33 1 23 45 67 89",
    address: "12 rue des Tilleuls, 75011 Paris",
    cta: "Prendre rendez-vous",
    ctaHref: "#top",
  },
  // --- Sections DESIGN -------------------------------------------------------
  "parallax-strip": {
    eyebrow: "Notre univers",
    title: "Un travail qui se voit, des résultats qui se vivent",
    cta: "Découvrir nos réalisations",
    image: `${M}/hero.jpg`,
  },
  "gallery-mosaic": {
    eyebrow: "Réalisations",
    title: "Nos derniers projets en images",
    images: [`${M}/hero.jpg`, `${M}/sess2.jpg`, `${M}/int4.jpg`, `${M}/still1.jpg`, `${M}/hero2.jpg`, `${M}/sess3.jpg`],
  },
  "team-cards": {
    eyebrow: "L'équipe",
    title: "Les visages derrière le travail bien fait",
    items: [
      { name: "Camille Aubert", role: "Fondatrice", bio: "Quinze ans de métier et toujours la même exigence : un travail propre, expliqué, garanti.", avatar: `${M}/coach.jpg` },
      { name: "Julien Mercier", role: "Responsable projets", bio: "Votre interlocuteur du devis à la livraison — un suivi clair, sans surprise.", avatar: `${M}/av2.jpg` },
      { name: "Léa Fontan", role: "Relation clients", bio: "Réponse en moins de 24 h et un seul objectif : que tout soit simple pour vous.", avatar: `${M}/av1.jpg` },
    ],
  },
  "story-timeline": {
    eyebrow: "Notre parcours",
    title: "Une histoire qui se construit avec vous",
    items: [
      { year: "2015", title: "Les débuts", text: "Une personne, un savoir-faire, et les premiers clients qui nous font confiance." },
      { year: "2019", title: "L'équipe s'agrandit", text: "Trois collaborateurs nous rejoignent pour répondre à une demande qui grandit." },
      { year: "2022", title: "La reconnaissance", text: "Certification du métier et plus de 200 projets livrés sans accroc." },
      { year: "Aujourd'hui", title: "À vos côtés", text: "La même exigence du premier jour, au service de chaque nouveau projet." },
    ],
  },
  "quote-spotlight": {
    quote: "Le travail bien fait ne se raconte pas : il se constate, projet après projet.",
    author: "Camille Aubert",
    role: "Fondatrice",
  },
  "marquee-words": {
    words: ["Savoir-faire", "Confiance", "Proximité", "Qualité", "Engagement"],
  },
  // --- Effets portés en sections ----------------------------------------------
  "fx-circular-reviews": {
    eyebrow: "Témoignages",
    title: "Ils nous ont fait confiance",
    items: [
      { quote: "Un accompagnement d'une justesse rare — chaque détail compte, et ça se voit dans le résultat.", name: "Tamar M.", role: "Cliente depuis 2023", avatar: `${M}/trio1.jpg` },
      { quote: "Une expérience au-delà de nos attentes, une équipe attentive du début à la fin.", name: "Joe C.", role: "Projet sur mesure", avatar: `${M}/trio2.jpg` },
      { quote: "Le sérieux et l'attention portée aux détails ont rendu cette collaboration inoubliable.", name: "Martina E.", role: "Accompagnement complet", avatar: `${M}/trio3.jpg` },
    ],
  },
  "fx-container-scroll": {
    eyebrow: "Découvrez",
    title: "Notre univers",
    image: `${M}/hero.jpg`,
  },
  "fx-display-cards": {
    eyebrow: "Temps forts",
    title: "Ce qui fait la différence",
    items: [
      { title: "À l'affiche", desc: "Une sélection signature", meta: "À l'instant" },
      { title: "Populaire", desc: "Les coups de cœur du moment", meta: "Cette semaine" },
      { title: "Nouveau", desc: "Les dernières créations", meta: "Aujourd'hui" },
    ],
  },
  "fx-stagger-reviews": {
    items: [
      { quote: "Un travail d'une précision rare, livré plus vite que prévu.", by: "Alex, chef d'entreprise" },
      { quote: "On s'est sentis écoutés du premier rendez-vous à la livraison.", by: "Dana, cliente 2025" },
      { quote: "Le résultat dépasse tout ce qu'on avait imaginé.", by: "Stéphanie, directrice com" },
      { quote: "Réactif, créatif, professionnel : je recommande les yeux fermés.", by: "Marie, organisatrice" },
      { quote: "Si je pouvais mettre 11 étoiles, j'en mettrais 12.", by: "André, restaurateur" },
      { quote: "Un suivi impeccable et un résultat qu'on admire chaque jour.", by: "Jérémy & Lou" },
    ],
  },
  "fx-shuffle-reviews": {
    eyebrow: "Ils en parlent",
    title: "La parole à nos clients",
    items: [
      { quote: "Un résultat qui nous ressemble — on en profite chaque jour.", author: "Camille R. — Particulier" },
      { quote: "Un regard unique, une équipe discrète : le résultat est superbe.", author: "Julien M. — Professionnel" },
      { quote: "Réactif, créatif, et un rendu plus beau qu'espéré.", author: "Sarah L. — Entreprise" },
    ],
  },
  "fx-floating-tags": {
    text: "Notre approche est bien plus que professionnelle — elle est profondément humaine. Nos valeurs guident chaque projet.",
    tags: ["Confiance", "Écoute", "Exigence", "Proximité", "Transparence"],
  },
};

/** Échantillons complets : socle + library extraite des sites. */
export const SAMPLES: Record<string, Record<string, unknown>> = {
  ...CORE_SAMPLES,
  ...LIBRARY_SAMPLES,
};

export function getSample(id: string): Record<string, unknown> {
  return SAMPLES[id] ?? {};
}

/** Recette d'aperçu mono-composant (vibe warm-serif) pour /foundry-preview/[id]. */
export function previewRecipe(id: string): Recipe {
  return {
    vibe: "warm-serif",
    brand: { primary: "#8d6959" },
    sections: [{ component: id, content: getSample(id) }],
  };
}
