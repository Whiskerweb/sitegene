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
    title: ['Create Timeless Photos', 'That Tell Your Story'],
    subtitle:
      'Professional photography for personal moments, brands, and unforgettable memories.',
    cta: 'Book a Session',
  },

  features: [
    { title: 'Fast Delivery', body: 'Get your edited gallery in a short time' },
    { title: 'Personal Approach', body: 'Every shoot is tailored to your vision' },
    { title: 'Natural Style', body: 'Authentic photos with emotion and elegance' },
  ] as Feature[],

  // Citation mise en avant
  featuredQuote: {
    text: 'Alice has a rare gift — she captures the feeling of a moment, not just the moment itself. Every photo feels like a memory we get to keep forever.',
    name: 'Élise Caron',
    role: 'Wedding Client',
    avatar: img(7),
    images: [img(4), img(12)],
  },

  // Grand texte révélé au scroll
  scrollText:
    'Photography, to me, is more than an image — it is a feeling preserved. I chase light, emotion and the unrepeatable in-between moments that make a story worth telling.',

  // Services (accordéon)
  servicesIntro:
    'From quiet portraits to full brand stories, every session is crafted around your vision.',
  services: [
    {
      n: '01',
      name: 'Portrait Sessions',
      desc: 'Timeless portraits that reveal personality, mood and the quiet story behind every face.',
      tags: ['Studio', 'Editorial', 'Headshots'],
      img: img(1),
    },
    {
      n: '02',
      name: 'Weddings & Events',
      desc: 'Candid, emotional coverage of weddings and gatherings as they truly unfold.',
      tags: ['Weddings', 'Engagements', 'Travel'],
      img: img(5),
    },
    {
      n: '03',
      name: 'Family Sessions',
      desc: 'Warm, natural family moments captured in light that feels soft, intimate and honest.',
      tags: ['Newborn', 'Lifestyle', 'Generations'],
      img: img(4),
    },
    {
      n: '04',
      name: 'Brand & Editorial',
      desc: 'Refined visual stories that bring your products and brand to life with elegance.',
      tags: ['Product', 'Campaigns', 'Lookbooks'],
      img: img(6),
    },
  ] as Service[],

  // Marquee « collaborations »
  collaborations: [
    'VOGUE', 'AESOP', 'AIRBNB', 'KINFOLK', 'CANON', 'CÉLINE', 'LEICA', 'APARTAMENTO',
  ] as string[],

  // Works (grille projets)
  works: [
    { date: 'January 2026', category: 'Fashion Editorial', title: 'Golden Hour', desc: 'An editorial chasing the last warm light of the day across soft, textured fabrics.', img: img(3) },
    { date: 'December 2025', category: 'Family Sessions', title: "Zoe's First Days", desc: 'The earliest moments of life captured in a calm, cozy setting with soft natural light.', img: img(8) },
    { date: 'November 2025', category: 'Wedding', title: 'A Quiet Vow', desc: 'An intimate ceremony documented in candid, emotional frames from dawn to dusk.', img: img(9) },
    { date: 'October 2025', category: 'Brand & Editorial', title: 'Maison Verte', desc: 'A brand story inspired by nature, warmth and organic, hand-made beauty.', img: img(6) },
  ] as Work[],

  // Stats + CTA « beyond the frame »
  beyond: {
    title: 'Capture Beyond the Frame',
    body: 'Every shoot is a collaboration. I take the time to understand your story, then translate it into images that feel honest, warm and lasting.',
    cta: 'Start your story',
    stats: [
      { v: '10+', l: 'Years behind the lens' },
      { v: '320', l: 'Stories captured' },
      { v: '24', l: 'Awards & features' },
    ],
  },

  // Témoignages
  testimonials: [
    { text: 'Alice captured our wedding with such artistry. Every frame feels alive and honest.', name: 'Amara Okafor', role: 'Wedding Client', avatar: img(7) },
    { text: 'The most effortless shoot I have ever done. The results spoke louder than any words could.', name: 'Lukas Meyer', role: 'Creative Director', avatar: img(8) },
    { text: 'Genuine, patient and ridiculously talented. Our family session felt like a quiet afternoon together.', name: 'Sofia Bianchi', role: 'Family Session', avatar: img(9) },
  ] as Testimonial[],

  // FAQ (accordéon)
  faqs: [
    { q: 'How do I book a session?', a: 'Reach out via the contact form or email, share your vision and preferred dates, and I will send a tailored proposal within 48 hours.' },
    { q: 'What is included in a shoot?', a: 'Pre-shoot planning, the session itself, professional retouching and a private online gallery with high-resolution downloads.' },
    { q: 'How long until I get my photos?', a: 'Edited galleries are delivered within 7 to 14 days depending on the scope of the project.' },
    { q: 'Do you travel for shoots?', a: 'Absolutely — I work locally and am available worldwide for the right project.' },
    { q: 'Can I order prints?', a: 'Yes, fine-art prints and albums are available as add-ons in premium quality, hand-checked before shipping.' },
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
        title: 'Through my lens',
        intro: 'A selection of recent stories — portraits, weddings, editorials.',
        galleries: [
          { category: 'Selected work', images: [10, 11, 12, 13, 1, 2, 3, 4, 5, 6, 7, 8].map(img) },
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
        title: 'Let’s create something together',
        intro: 'Tell me about your project and preferred dates — I reply within 48 hours.',
        email: 'hello@alicer.studio',
        zones: ['Paris', 'Worldwide on request'],
        pricing: [
          { name: 'Portrait Session', price: 'from €350', detail: '1h studio or outdoor, 20 edited photos' },
          { name: 'Weddings & Events', price: 'from €1 800', detail: 'Full-day coverage, private gallery' },
          { name: 'Brand & Editorial', price: 'on quote', detail: 'Half or full-day shoot, usage rights' },
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
