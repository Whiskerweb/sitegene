// app/foundry-demo/demo-recipe.ts
import type { Recipe } from "@/lib/foundry/types";

const M = "/_templates/sereenity/media";

export const demoRecipe: Recipe = {
  vibe: "warm-serif",
  brand: { primary: "#8d6959" },
  sections: [
    {
      component: "hero-split-asym",
      content: {
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
    },
    {
      component: "logo-marquee",
      content: { title: "Recommandée par", items: ["Psycho & Vous", "Mag Bien-être", "Radio Sérénité", "Le Cercle", "Présence", "Ancrage"] },
    },
    {
      component: "services-rows",
      content: {
        eyebrow: "Mon accompagnement",
        title: "Comment je vous aide à avancer",
        items: [
          { n: "01", name: "Accompagnement individuel", desc: "Des séances en tête-à-tête pour apprivoiser le stress, l'anxiété ou une période de doute." },
          { n: "02", name: "Accompagnement de couple", desc: "Renouer le dialogue, reconstruire la confiance et traverser les tensions." },
          { n: "03", name: "Famille & parentalité", desc: "Un soutien pour les familles qui traversent un conflit ou un changement." },
        ],
      },
    },
    {
      component: "stats-countup",
      content: {
        eyebrow: "En quelques chiffres",
        title: "Un accompagnement qui change les choses",
        items: [
          { value: 500, suffix: "+", label: "personnes accompagnées" },
          { value: 92, suffix: "%", label: "ressentent un mieux dès 3 séances" },
          { value: 12, suffix: "", label: "ans d'expérience" },
          { value: 2000, suffix: "+", label: "séances en visio menées" },
        ],
      },
    },
    {
      component: "reviews-postit-carousel",
      content: {
        eyebrow: "Témoignages",
        title: "Vous n'êtes pas seul",
        items: [
          { text: "L'accompagnement a changé ma vie.", name: "Émilie C.", role: "Accompagnement individuel", avatar: `${M}/av1.jpg` },
          { text: "Je me suis senti écouté et accompagné.", name: "Marc L.", role: "Séances en visio", avatar: `${M}/av2.jpg` },
          { text: "On m'a aidée sans me laisser définir par ma douleur.", name: "Hana M.", role: "Accompagnement du deuil", avatar: `${M}/av3.jpg` },
        ],
      },
    },
    {
      component: "pricing-cards",
      content: {
        eyebrow: "Tarifs",
        title: "Des formules claires, sans surprise",
        plans: [
          { name: "Découverte", price: "49 €", period: "/séance", desc: "Pour faire un premier pas en douceur.", features: ["Une séance d'accompagnement", "En visio ou en présentiel", "Objectifs personnalisés", "Accès à l'espace client"], cta: "Réserver ma séance" },
          { name: "Évolution", price: "89 €", period: "/séance", featured: true, desc: "Le rythme idéal pour un vrai changement.", features: ["Accompagnement dédié", "En visio ou en présentiel", "Plan de progression sur-mesure", "Messagerie entre les séances"], cta: "Réserver ma séance" },
          { name: "Sérénité", price: "229 €", period: "/mois", desc: "Le suivi le plus complet.", features: ["Séances illimitées", "Soutien prioritaire", "Messagerie entre les séances", "Ligne d'écoute"], cta: "Réserver ma séance" },
        ],
      },
    },
    {
      component: "faq-accordion",
      content: {
        eyebrow: "Vos questions",
        title: "Les questions que l'on me pose souvent",
        items: [
          { q: "Comment se passe une première séance ?", a: "On fait connaissance en douceur : vous racontez ce qui vous amène, à votre rythme, et on définit ensemble un cap clair." },
          { q: "Les séances sont-elles confidentielles ?", a: "Strictement. Tout ce qui se dit reste entre nous — c'est la base de la confiance et du travail." },
          { q: "En présentiel ou en visio ?", a: "Les deux : au cabinet ou en visio, avec le même soin et la même qualité d'écoute." },
          { q: "Et si je ne suis pas sûr d'en avoir besoin ?", a: "C'est normal d'hésiter. Le premier échange est sans engagement, justement pour y voir clair ensemble." },
        ],
      },
    },
    {
      component: "cta-banner",
      content: {
        title: "Votre cheminement commence par un premier pas : celui de tendre la main.",
        cta: "Prendre rendez-vous",
        image: `${M}/int4.jpg`,
      },
    },
    {
      component: "footer-columns",
      content: {
        brand: "Sereenity",
        tagline: "Votre espace pour avancer, grandir et vous sentir compris.",
        columns: [
          { title: "Liens rapides", links: ["Accueil", "À propos", "Services", "Tarifs"] },
          { title: "Me contacter", links: ["bonjour@sereenity.fr", "+33 1 23 45 67 89", "12 rue des Tilleuls, Paris"] },
        ],
        copyright: "© Sereenity. Tous droits réservés.",
      },
    },
  ],
};
