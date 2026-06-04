// Contenu centralisé du template photographe « Target » (recréation).
//
// SCHÉMA v2 : un site = un shell (`site`) + des pages typées (`pages[]`).
// À l'exécution, si `window.__SITE_CONTENT__` existe (injecté par la plateforme),
// il REMPLACE DEFAULT_CONTENT (même forme v2). Le contenu effectif, normalisé,
// est exposé via `SITE` ; les composants le lisent via le contexte de page
// (`usePage()` / `useSite()`).

import { normalizeDefault } from '../site/normalize'

const img = (n: number) => `img/p${n}.jpg`

/* ------------------------------------------------------------------ */
/* Types (inchangés)                                                   */
/* ------------------------------------------------------------------ */
export interface Service {
  n: string
  name: string
  desc: string
  tags: string[]
  img: string
}

export interface Work {
  date: string
  category: string
  title: string
  desc: string
  img: string
}

export interface Testimonial { text: string; name: string; role: string; avatar: string; rating: string }

export interface Faq { q: string; a: string }

/* ------------------------------------------------------------------ */
/* Contenu de la home (valeurs réelles target — FR, marché France)     */
/* ------------------------------------------------------------------ */
const HOME_CONTENT = {
  hero: {
    tagline: 'Créatif primé',
    title: 'PHOTOGRAPHE',
    blurb:
      'Des instants intemporels qui racontent l’émotion, la beauté et la vérité, dans chaque image et chaque pose.',
    email: 'hello@timijoel.com',
    phone: '+234 123 456 7890',
    role: 'Photographe',
    location: 'Nigeria, Pays-Bas.',
    recentWork: img(13),
    badge: 'Prix Hasselblad',
    badgeYears: '2025, 2023',
    socials: ['Instagram', 'Dribbble'],
  },

  // Citation mise en avant
  featuredQuote: {
    text: 'Travailler avec Timi Joel a été un vrai plaisir. Son sens du détail et sa capacité à saisir des émotions sincères donnent vie à chaque image. Un très grand photographe.',
    name: 'Sarah K.',
    role: 'Cliente événement',
    avatar: img(7),
    images: [img(4), img(12)],
  },

  // Grand texte d'intro (mots révélés au scroll)
  intro:
    'Bonjour, je suis Timi Joel, photographe portrait 🏞️ et lifestyle 📸, passionné par les instants ✨ vrais, intemporels ⏱️ et pleins de vie. La photographie, c’est ce que j’aime faire. 🧡',

  servicesIntro:
    'Du portrait à l’événement, une photographie professionnelle pensée pour votre vision.',
  services: [
    {
      n: '01',
      name: 'Photographie de portrait',
      desc: 'Des portraits intemporels qui révèlent la personnalité, l’humeur et l’histoire discrète de chaque visage.',
      tags: ['Studio', 'Éditorial', 'Portraits pro'],
      img: img(1),
    },
    {
      n: '02',
      name: 'Événements & extérieur',
      desc: 'Une couverture spontanée et pleine d’énergie des mariages, célébrations et instants en plein air.',
      tags: ['Mariages', 'Concerts', 'Voyage'],
      img: img(5),
    },
    {
      n: '03',
      name: 'Séances famille',
      desc: 'Des moments de famille chaleureux et naturels, dans une lumière douce, intime et sincère.',
      tags: ['Naissance', 'Lifestyle', 'Générations'],
      img: img(4),
    },
    {
      n: '04',
      name: 'Retouche & post-production',
      desc: 'Une post-production soignée qui sublime chaque image tout en la gardant vraie et naturelle.',
      tags: ['Colorimétrie', 'Retouche peau', 'Composites'],
      img: img(2),
    },
    {
      n: '05',
      name: 'Photographie de marque',
      desc: 'Donnez vie à vos produits et à l’histoire de votre marque par des visuels puissants et réfléchis.',
      tags: ['Packshots', 'Contenu marketing', 'Campagnes'],
      img: img(6),
    },
  ] as Service[],

  // Logos partenaires neutres (façon Logoipsum, PAS de vraies marques).
  collaborations: [
    'Lumière', 'Aperture', 'Studio 9', 'Northlight',
    'Frame Co', 'Optik', 'Verve', 'Atelier',
  ] as string[],
  // Étiquettes de réassurance affichées à côté de la grille de logos.
  collabLabels: [
    '5+ ans d’expérience',
    'Photographe de l’année 2025',
  ] as string[],

  works: [
    { date: 'Janvier 2026', category: 'Éditorial mode', title: 'Le denim réinventé', desc: 'Un éditorial mode qui explore le denim au-delà de sa forme classique — créativité, matière et polyvalence à travers des looks stylisés.', img: img(3) },
    { date: 'Décembre 2025', category: 'Séances famille', title: 'Les premiers jours de Zoé', desc: 'Les tout premiers instants d’une vie, saisis dans un cadre calme et douillet, en lumière naturelle.', img: img(4) },
    { date: 'Novembre 2025', category: 'Lifestyle extérieur', title: 'Matin en mouvement', desc: 'Une séance lifestyle au lever du soleil — lumière naturelle et expressions spontanées.', img: img(5) },
    { date: 'Octobre 2025', category: 'Marque & commercial', title: 'Gaia Essence Skincare', desc: 'Un éditorial de marque inspiré par la nature, la chaleur et la beauté organique.', img: img(6) },
  ] as Work[],

  // Bento « beyond the frame » + compteurs animés
  beyond: {
    heading: 'Au-delà du cadre',
    cards: {
      adapt: {
        title: 'Intérieur ou extérieur ? Je m’adapte à chaque décor pour saisir l’image parfaite.',
        img: img(5),
      },
      trust: {
        title: 'Une expérience éprouvée, la confiance de nombreux clients',
        desc: 'Plus de 10 000 photos réalisées et 80+ clients satisfaits.',
        imgs: [img(7), img(8), img(9), img(10), img(11), img(12)],
      },
      gear: {
        title: 'Je travaille avec du matériel',
        accent: 'professionnel',
        tail: ' haut de gamme.',
        desc: 'Chaque équipement que j’utilise est de premier ordre : des images nettes, détaillées, prêtes pour l’impression comme pour le digital.',
        img: img(2),
      },
      recognition: {
        title: 'Reconnu au-delà des frontières',
        desc: 'Une reconnaissance internationale qui reflète l’exigence.',
        img: img(6),
      },
      editing: {
        title: 'Une retouche qui sublime, sans dénaturer',
        desc: 'Chaque retouche renforce l’émotion de vos photos.',
        img: img(1),
      },
      portrait: { img: img(3) },
      rating: { value: '80+', label: 'clients satisfaits' },
    },
    stats: [
      { value: 38, suffix: '+', label: 'Prix' },
      { value: 100, suffix: '%', label: 'Clients qui recommandent' },
      { value: 12, suffix: 'K+', label: 'Photos réalisées' },
    ],
  },

  testimonials: [
    { text: 'Timi a photographié notre mariage avec un vrai sens artistique. Chaque image est vivante et sincère — son attention au détail et sa façon de saisir les émotions ont fait de chaque photo un souvenir précieux.', name: 'Amara Okafor', role: 'Cliente mariage', avatar: img(7), rating: '4,9/5' },
    { text: 'La séance la plus fluide que j’aie jamais faite. Le résultat parle de lui-même, et tout le processus est resté calme, précis et profondément créatif du début à la fin.', name: 'Lukas Meyer', role: 'Directeur de création', avatar: img(8), rating: '5,0/5' },
    { text: 'Sincère, patient et incroyablement talentueux. Notre séance famille ressemblait à un jeu, et les photos sont revenues dignes d’une galerie d’art. Nous recommandons sans réserve.', name: 'Sofia Bianchi', role: 'Séance famille', avatar: img(9), rating: '4,8/5' },
  ] as Testimonial[],

  faqs: [
    { q: 'Comment réserver une séance ?', a: 'Écrivez-moi via le formulaire de contact ou par email, partagez votre projet et vos dates : je vous envoie une proposition sur mesure sous 48 heures.' },
    { q: 'Que comprend une séance ?', a: 'La préparation en amont, la séance elle-même, la retouche professionnelle et une galerie privée en ligne avec téléchargements haute définition.' },
    { q: 'Sous quel délai recevrai-je mes photos ?', a: 'Les galeries retouchées sont livrées sous 7 à 14 jours selon l’ampleur du projet.' },
    { q: 'Vous déplacez-vous ?', a: 'Absolument — je travaille entre le Nigeria et les Pays-Bas, et je suis disponible dans le monde entier pour les beaux projets.' },
    { q: 'Puis-je commander des tirages ?', a: 'Oui, des tirages fine-art et des albums sont proposés en option, en qualité premium et vérifiés à la main avant expédition.' },
  ] as Faq[],

  // Galerie — ORDRE des photos (les vignettes sont calculées via img()).
  galleryOrder: [10, 11, 12, 13, 14, 1, 2, 3, 4, 5, 6, 7] as number[],
}

// Galerie dérivée (chemins relatifs) — partagée home + portfolio.
const GALLERY = HOME_CONTENT.galleryOrder.map(img)

/* ------------------------------------------------------------------ */
/* Contenu par défaut v2 (site + pages)                                */
/* ------------------------------------------------------------------ */
const DEFAULT_CONTENT = {
  version: 2,
  site: {
    brand: '✦ TARGET',
    nav: [
      { label: 'Accueil', to: '/' },
      { label: 'Portfolio', to: '/portfolio' },
      { label: 'À propos', to: '/a-propos' },
      { label: 'Contact', to: '/contact' },
    ],
    footer: {
      title: 'Chaque image raconte une histoire : parlons-en',
      email: 'hello@timijoel.com',
      socials: ['Instagram', 'Dribbble', 'Behance'],
    },
    theme: {}, // accents/géométrie/palette DA restent dans les composants
  },
  pages: [
    {
      slug: '/',
      type: 'home',
      title: 'Target — Photographe',
      meta: { description: 'Photographe portrait & lifestyle : moments réels, intemporels et pleins de vie.' },
      content: {
        ...HOME_CONTENT,
        gallery: GALLERY,
      },
    },
    {
      slug: '/portfolio',
      type: 'portfolio',
      title: 'Portfolio — Target',
      meta: { description: 'Une sélection de projets : éditoriaux mode, lifestyle outdoor et marques.' },
      content: {
        title: 'Mes projets',
        intro: 'Une sélection de travaux récents — éditoriaux, lifestyle en extérieur et histoires de marques.',
        works: HOME_CONTENT.works,
        gallery: GALLERY,
      },
    },
    {
      slug: '/a-propos',
      type: 'about',
      title: 'À propos — Target',
      meta: { description: 'Approche, démarche et chiffres clés du photographe Timi Joel.' },
      content: {
        intro: HOME_CONTENT.intro,
        featuredQuote: HOME_CONTENT.featuredQuote,
        beyond: HOME_CONTENT.beyond,
        testimonials: HOME_CONTENT.testimonials,
      },
    },
    {
      slug: '/contact',
      type: 'contact',
      title: 'Contact — Target',
      meta: { description: 'Lancez votre projet photo. Réponse sous 48 heures.' },
      content: {
        title: 'Lançons votre projet',
        intro: 'Parlez-moi de votre projet et de vos dates : je réponds sous 48 heures.',
        email: 'hello@timijoel.com',
        zones: ['Nigeria', 'Pays-Bas', 'Monde entier sur demande'],
        pricing: [
          { name: 'Séance portrait', price: 'dès 350 €', detail: '1 h en studio ou extérieur, 20 photos retouchées' },
          { name: 'Événements & extérieur', price: 'dès 1 500 €', detail: 'Demi-journée ou journée complète, galerie privée' },
          { name: 'Marque & commercial', price: 'sur devis', detail: 'Prise de vue, retouche & colorimétrie, droits d’usage' },
        ],
        faqs: HOME_CONTENT.faqs,
      },
    },
  ],
} as const

/* ------------------------------------------------------------------ */
/* Sélection runtime : global injecté > défaut                         */
/* ------------------------------------------------------------------ */
const C =
  typeof window !== 'undefined' && (window as any).__SITE_CONTENT__
    ? ((window as any).__SITE_CONTENT__ as typeof DEFAULT_CONTENT)
    : DEFAULT_CONTENT

// Exposé pour la plateforme (dump des contenus par défaut → default-content.json).
export const __DEFAULT_CONTENT__ = DEFAULT_CONTENT

// Contenu v2 effectif (injecté > défaut), normalisé.
export const SITE = normalizeDefault(C)
