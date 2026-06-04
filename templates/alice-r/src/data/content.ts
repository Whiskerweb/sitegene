// Contenu centralisé du site Alice R — photographe (DA sombre, chaude, élégante).
//
// SCHÉMA v2 : un site = un shell (`site`) + des pages typées (`pages[]`).
// À l'exécution, si `window.__SITE_CONTENT__` existe (injecté par la plateforme),
// il REMPLACE DEFAULT_CONTENT (même forme v2). Le contenu effectif, normalisé,
// est exposé via `SITE` ; les composants le lisent via le contexte de page
// (`usePage()` / `useSite()`), plus via des globals de module.

import { normalizeDefault } from '../site/normalize'

const img = (n: number) => `img/p${n}.jpg`

/* ------------------------------------------------------------------ */
/* Types (inchangés)                                                   */
/* ------------------------------------------------------------------ */
export interface ArcPhoto {
  img: string
  top: string // % vertical
  left: string // % horizontal
  rotate: number // degrés
  size: number // px (desktop)
}

export interface Feature {
  title: string
  body: string
}

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

export interface Testimonial { text: string; name: string; role: string; avatar: string }

export interface Faq { q: string; a: string }

/* ------------------------------------------------------------------ */
/* Contenu de la home (objet historique, réutilisé tel quel)           */
/* ------------------------------------------------------------------ */
const HOME_CONTENT = {
  // Hero — arc de photos. 13 photos disposées en arc/éventail autour du texte.
  arcPhotos: [
    { img: 'img/p1.jpg', top: '20%', left: '17%', rotate: 10, size: 150 },
    { img: 'img/p2.jpg', top: '12%', left: '29%', rotate: -6, size: 165 },
    { img: 'img/p3.jpg', top: '8%', left: '43%', rotate: 4, size: 150 },
    { img: 'img/p4.jpg', top: '11%', left: '57%', rotate: -3, size: 160 },
    { img: 'img/p5.jpg', top: '20%', left: '70%', rotate: 7, size: 165 },
    { img: 'img/p6.jpg', top: '38%', left: '82%', rotate: -8, size: 150 },
    { img: 'img/p7.jpg', top: '36%', left: '8%', rotate: -9, size: 155 },
    { img: 'img/p8.jpg', top: '58%', left: '12%', rotate: 8, size: 160 },
    { img: 'img/p9.jpg', top: '60%', left: '84%', rotate: 6, size: 155 },
    { img: 'img/p10.jpg', top: '80%', left: '10%', rotate: -5, size: 150 },
    { img: 'img/p11.jpg', top: '82%', left: '85%', rotate: 7, size: 150 },
    { img: 'img/p12.jpg', top: '90%', left: '26%', rotate: 9, size: 140 },
    { img: 'img/p13.jpg', top: '92%', left: '70%', rotate: -7, size: 140 },
  ] as ArcPhoto[],

  hero: {
    brand: 'Alice R',
    title: ['Des photos intemporelles', 'qui racontent votre histoire'],
    subtitle:
      'Photographie professionnelle pour vos moments de vie, vos marques et vos souvenirs inoubliables.',
    cta: 'Réserver une séance',
  },

  features: [
    { title: 'Livraison rapide', body: 'Votre galerie retouchée, livrée en quelques jours' },
    { title: 'Approche personnelle', body: 'Chaque séance est pensée autour de votre vision' },
    { title: 'Style naturel', body: 'Des photos authentiques, pleines d’émotion et d’élégance' },
  ] as Feature[],

  // Citation mise en avant
  featuredQuote: {
    text: 'Alice a un don rare — elle capture l’émotion d’un instant, pas seulement l’instant. Chaque photo est un souvenir que l’on garde pour toujours.',
    name: 'Élise Caron',
    role: 'Mariée',
    avatar: img(7),
    images: [img(4), img(12)],
  },

  // Grand texte révélé au scroll
  scrollText:
    'La photographie, pour moi, est plus qu’une image — c’est une émotion préservée. Je cherche la lumière, l’émotion et ces instants suspendus, uniques, qui font qu’une histoire mérite d’être racontée.',

  // Services (accordéon)
  servicesIntro:
    'Du portrait intimiste à l’histoire de marque complète, chaque séance est construite autour de votre vision.',
  services: [
    {
      n: '01',
      name: 'Séances portrait',
      desc: 'Des portraits intemporels qui révèlent la personnalité, l’humeur et l’histoire silencieuse de chaque visage.',
      tags: ['Studio', 'Éditorial', 'Portraits pro'],
      img: img(1),
    },
    {
      n: '02',
      name: 'Mariages & événements',
      desc: 'Une couverture sincère et émouvante de vos mariages et réceptions, tels qu’ils se vivent vraiment.',
      tags: ['Mariages', 'Fiançailles', 'Destination'],
      img: img(5),
    },
    {
      n: '03',
      name: 'Séances famille',
      desc: 'Des moments de famille chaleureux et naturels, dans une lumière douce, intime et honnête.',
      tags: ['Naissance', 'Lifestyle', 'Générations'],
      img: img(4),
    },
    {
      n: '04',
      name: 'Marque & éditorial',
      desc: 'Des histoires visuelles raffinées qui donnent vie à vos produits et à votre marque avec élégance.',
      tags: ['Produit', 'Campagnes', 'Lookbooks'],
      img: img(6),
    },
  ] as Service[],

  // Marquee « collaborations »
  collaborations: [
    'VOGUE', 'AESOP', 'AIRBNB', 'KINFOLK', 'CANON', 'CÉLINE', 'LEICA', 'APARTAMENTO',
  ] as string[],

  // Works (grille projets)
  works: [
    { date: 'Janvier 2026', category: 'Éditorial mode', title: 'Heure dorée', desc: 'Un éditorial à la poursuite des dernières lumières chaudes du jour, sur des étoffes douces et texturées.', img: img(3) },
    { date: 'Décembre 2025', category: 'Séances famille', title: 'Les premiers jours de Zoé', desc: 'Les tout premiers instants d’une vie, capturés dans un cocon calme baigné de lumière naturelle.', img: img(8) },
    { date: 'Novembre 2025', category: 'Mariage', title: 'Un serment murmuré', desc: 'Une cérémonie intime documentée en images sincères et émouvantes, de l’aube au crépuscule.', img: img(9) },
    { date: 'Octobre 2025', category: 'Marque & éditorial', title: 'Maison Verte', desc: 'Une histoire de marque inspirée par la nature, la chaleur et la beauté de l’artisanat.', img: img(6) },
  ] as Work[],

  // Stats + CTA « beyond the frame »
  beyond: {
    title: 'Capturer au-delà du cadre',
    body: 'Chaque séance est une collaboration. Je prends le temps de comprendre votre histoire, puis je la traduis en images sincères, chaleureuses et durables.',
    cta: 'Commencer votre histoire',
    stats: [
      { v: '10+', l: 'Années derrière l’objectif' },
      { v: '320', l: 'Histoires racontées' },
      { v: '24', l: 'Prix & publications' },
    ],
  },

  // Témoignages
  testimonials: [
    { text: 'Alice a photographié notre mariage avec un art fou. Chaque image est vivante et sincère.', name: 'Amara Okafor', role: 'Mariée', avatar: img(7) },
    { text: 'La séance la plus naturelle que j’aie jamais vécue. Le résultat parle de lui-même.', name: 'Lukas Meyer', role: 'Directeur artistique', avatar: img(8) },
    { text: 'Sincère, patiente et terriblement talentueuse. Notre séance famille a eu la douceur d’un après-midi tranquille.', name: 'Sofia Bianchi', role: 'Séance famille', avatar: img(9) },
  ] as Testimonial[],

  // FAQ (accordéon)
  faqs: [
    { q: 'Comment réserver une séance ?', a: 'Écrivez-moi via le formulaire de contact ou par email, partagez votre vision et vos dates — je vous envoie une proposition sur mesure sous 48 h.' },
    { q: 'Que comprend une séance ?', a: 'La préparation en amont, la séance elle-même, la retouche professionnelle et une galerie privée en ligne avec téléchargements haute définition.' },
    { q: 'Sous quel délai vais-je recevoir mes photos ?', a: 'Les galeries retouchées sont livrées sous 7 à 14 jours selon l’ampleur du projet.' },
    { q: 'Vous déplacez-vous ?', a: 'Absolument — je travaille localement et me déplace partout dans le monde pour les beaux projets.' },
    { q: 'Puis-je commander des tirages ?', a: 'Oui — tirages fine-art et albums sont disponibles en option, en qualité premium, vérifiés à la main avant expédition.' },
  ] as Faq[],

  // Galerie — liste des vignettes (chemins relatifs réécrits en absolus au dump).
  gallery: [10, 11, 12, 13, 1, 2, 3, 4, 5, 6, 7, 8].map(img) as string[],
}

/* ------------------------------------------------------------------ */
/* Contenu par défaut v2 (site + pages)                                */
/* ------------------------------------------------------------------ */
const DEFAULT_CONTENT = {
  version: 2,
  site: {
    brand: 'Alice R',
    nav: [
      { label: 'Accueil', to: '/' },
      { label: 'Portfolio', to: '/portfolio' },
      { label: 'À propos', to: '/a-propos' },
      { label: 'Contact', to: '/contact' },
    ],
    footer: {
      title: 'Chaque image raconte une histoire. Écrivons la vôtre.',
      email: 'hello@alicer.studio',
      socials: ['Instagram', 'Pinterest', 'Behance'],
    },
    theme: {}, // accents/géométrie structurels restent dans les composants
  },
  pages: [
    {
      slug: '/',
      type: 'home',
      title: 'Alice R — Photographe',
      meta: { description: 'Photographie de portraits, mariages et marques.' },
      content: HOME_CONTENT,
    },
    {
      slug: '/portfolio',
      type: 'portfolio',
      title: 'Portfolio — Alice R',
      meta: { description: 'Une sélection de séances portraits, mariages et éditoriaux.' },
      content: {
        title: 'À travers mon objectif',
        intro: 'Une sélection d’histoires récentes — portraits, mariages, éditoriaux.',
        galleries: [
          { category: 'Sélection', images: [10, 11, 12, 13, 1, 2, 3, 4, 5, 6, 7, 8].map(img) },
          { category: 'Portraits', images: [1, 7, 8, 9, 4].map(img) },
        ],
      },
    },
    {
      slug: '/a-propos',
      type: 'about',
      title: 'À propos — Alice R',
      meta: { description: 'Alice R, photographe : approche, démarche et chiffres.' },
      content: {
        scrollText: HOME_CONTENT.scrollText,
        featuredQuote: HOME_CONTENT.featuredQuote,
        beyond: HOME_CONTENT.beyond,
        testimonials: HOME_CONTENT.testimonials,
      },
    },
    {
      slug: '/contact',
      type: 'contact',
      title: 'Contact — Alice R',
      meta: { description: 'Réservez votre séance photo avec Alice R.' },
      content: {
        title: 'Créons quelque chose ensemble',
        intro: 'Parlez-moi de votre projet et de vos dates — je réponds sous 48 h.',
        email: 'hello@alicer.studio',
        zones: ['Paris', 'Monde entier sur demande'],
        pricing: [
          { name: 'Séance portrait', price: 'dès 350 €', detail: '1 h en studio ou en extérieur, 20 photos retouchées' },
          { name: 'Mariages & événements', price: 'dès 1 800 €', detail: 'Journée complète, galerie privée' },
          { name: 'Marque & éditorial', price: 'sur devis', detail: 'Demi-journée ou journée, droits d’usage inclus' },
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
