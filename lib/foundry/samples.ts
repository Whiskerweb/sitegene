// lib/foundry/samples.ts
// Contenu d'échantillon par composant — sert aux aperçus du catalogue dashboard
// et à la route /foundry-preview/[id]. Couvre toutes les contentKeys de chaque manifest.
import type { Recipe } from "./types";

const M = "/_templates/sereenity/media";

const REVIEWS = [
  { text: "L'accompagnement a changé ma vie : j'ai enfin osé en parler.", name: "Émilie C.", role: "Accompagnement individuel", avatar: `${M}/av1.jpg` },
  { text: "Je me suis senti écouté et accompagné, sans jamais de jugement.", name: "Marc L.", role: "Séances en visio", avatar: `${M}/av2.jpg` },
  { text: "On m'a aidée à faire de la place à la douleur sans la laisser me définir.", name: "Hana M.", role: "Accompagnement du deuil", avatar: `${M}/av3.jpg` },
  { text: "Des outils concrets pour me reconstruire, en sécurité dès le premier jour.", name: "David R.", role: "Transition de vie", avatar: `${M}/av1.jpg` },
];

/** Contenu d'échantillon par id de composant. */
export const SAMPLES: Record<string, Record<string, unknown>> = {
  "hero-split-asym": {
    badge: "4,9",
    title: "Retrouvez votre équilibre, une séance à la fois.",
    subtitle: "Un accompagnement chaleureux et sur-mesure pour traverser le stress, les doutes et les transitions de vie.",
    cta: "Prendre rendez-vous",
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
    image: `${M}/int4.jpg`,
  },
  "footer-columns": {
    brand: "Sereenity",
    tagline: "Votre espace pour avancer, grandir et vous sentir compris.",
    columns: [
      { title: "Liens rapides", links: ["Accueil", "À propos", "Services", "Tarifs"] },
      { title: "Me contacter", links: ["bonjour@sereenity.fr", "+33 1 23 45 67 89", "12 rue des Tilleuls, Paris"] },
    ],
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
