/**
 * Contenu FAQ — source unique réutilisée par la page /faq et le teaser
 * d'accueil. (Extrait de l'ancien components/landing/Faq.tsx.)
 */
export type FaqItem = { q: string; a: string };

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: "Je ne suis pas photographe, ça marche quand même ?",
    a: "Oui. Akyra s'adresse à tous les pros qui ont besoin d'un beau site vitrine. On démarre avec les photographes, et les musiciens et artisans arrivent très bientôt. Chaque métier a ses propres modèles, dessinés sur mesure.",
  },
  {
    q: "Je n'y connais rien en technique, c'est grave ?",
    a: "Pas du tout. Le site est déjà construit. Vous déposez vos photos, vous le nommez, c'est en ligne. Aucun code, aucun réglage compliqué.",
  },
  {
    q: "C'est 50 € par an, c'est tout ?",
    a: "Oui : 50 €/an pour votre site, tout compris (hébergement, mises à jour et votre adresse). Ça fait moins de 5 €/mois. Vous renouvelez une fois par an, comme un nom de domaine, et vous arrêtez quand vous voulez. Des options avancées comme les modifications illimitées existent en abonnement, mais vous n'êtes jamais obligé d'y souscrire. Aucun frais caché.",
  },
  {
    q: "Et mes photos ?",
    a: "On part de vos vraies photos pour habiller le design, et on les place au bon endroit. Vous gardez la main : on les remplace ou réordonne quand vous voulez.",
  },
  {
    q: "Je peux modifier mon site moi-même ?",
    a: "Oui, très simplement. Les textes et les photos se changent à la main, en cliquant dessus. Et pour tout ce qui touche à la mise en page, aux couleurs ou à la structure, vous le demandez à l'IA en une phrase : elle s'occupe du reste. Pas de code, jamais.",
  },
  {
    q: "Je peux mettre mon propre nom de domaine ?",
    a: "Au lancement votre site vit sur vous.akyra.com. Vous pourrez brancher votre domaine ensuite, en quelques clics.",
  },
];
