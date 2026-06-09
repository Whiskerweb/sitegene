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
      component: "testimonials-carousel",
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
