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

export interface Testimonial { text: string; name: string; role: string; avatar: string }

export interface Faq { q: string; a: string }

/* ------------------------------------------------------------------ */
/* Contenu de la home (valeurs réelles target)                         */
/* ------------------------------------------------------------------ */
const HOME_CONTENT = {
  hero: {
    tagline: 'Award-winning creative',
    title: 'PHOTOGRAPHER',
    blurb:
      'Capturing timeless moments that tell stories of emotion, beauty, and truth in every frame and every pose.',
    email: 'hello@timijoel.com',
    phone: '+234 123 456 7890',
    role: 'Photographer',
    location: 'Nigeria, Netherlands.',
    recentWork: img(13),
    badge: 'Hasselblad Award',
    badgeYears: '2025, 2023',
    socials: ['Instagram', 'Dribbble'],
  },

  // Citation mise en avant
  featuredQuote: {
    text: 'Working with Timi Joel was a delight. His attention to detail and ability to capture genuine emotions made every shot feel alive. He is a very good photographer',
    name: 'Sarah K.',
    role: 'Event Client',
    avatar: img(7),
    images: [img(4), img(12)],
  },

  // Grand texte d'intro (mots révélés au scroll)
  intro:
    "Hallo, I'm Timi Joel, a professional portrait 🏞️ and lifestyle photographer 📸 with a deep passion for capturing moments ✨ that feel real, timeless ⏱️, and full of life. Photography is what I love to do. 🧡",

  servicesIntro:
    'From portraits to events, I offer professional photography crafted to match your vision.',
  services: [
    {
      n: '01',
      name: 'Portrait Photography',
      desc: 'Timeless portraits that reveal personality, mood and the quiet story behind every face.',
      tags: ['Studio', 'Editorial', 'Headshots'],
      img: img(1),
    },
    {
      n: '02',
      name: 'Events & Outdoor Photography',
      desc: 'Candid, energetic coverage of weddings, gatherings and outdoor moments as they unfold.',
      tags: ['Weddings', 'Concerts', 'Travel'],
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
      name: 'Photo Retouching & Editing',
      desc: 'Refined post-production that elevates every image while keeping it real and natural.',
      tags: ['Color Grade', 'Skin Retouch', 'Composites'],
      img: img(2),
    },
    {
      n: '05',
      name: 'Brand & Commercial Photography',
      desc: 'Bring your products and brand stories to life through powerful visuals and thoughtfully captured photos.',
      tags: ['Product Photography', 'Marketing Content', 'Brand Campaigns'],
      img: img(6),
    },
  ] as Service[],

  collaborations: [
    'VOGUE', 'NIKE', 'AIRBNB', 'SPOTIFY', 'CANON', 'GUCCI', 'APPLE', 'LEICA',
  ] as string[],

  works: [
    { date: 'January 2026', category: 'Fashion Editorial', title: 'Denim Reimagined', desc: 'A fashion editorial exploring denim beyond its traditional form — creativity, texture and versatility through styled looks.', img: img(3) },
    { date: 'December 2025', category: 'Family Sessions', title: "Zoe's Newborn Beginnings", desc: 'Capturing the earliest moments of life in a calm, cozy setting with soft natural light.', img: img(4) },
    { date: 'November 2025', category: 'Outdoor Lifestyle', title: 'Morning in Motion', desc: 'A sunrise lifestyle shoot highlighting natural light and candid expressions.', img: img(5) },
    { date: 'October 2025', category: 'Brand & Commercial', title: 'Gaia Essence Skincare', desc: 'A brand-focused editorial inspired by nature, warmth and organic beauty.', img: img(6) },
  ] as Work[],

  // Stats + CTA « beyond the frame »
  beyond: {
    title: 'Capture Beyond the Frame',
    body: 'Photography, for me, is more than an image — it is a feeling preserved. I chase light, emotion and the unrepeatable in-between moments that make a story worth telling.',
    cta: 'Capture Your Story',
    stats: [
      { v: '12+', l: 'Years of experience' },
      { v: '450', l: 'Projects delivered' },
      { v: '38', l: 'Awards & features' },
    ],
  },

  testimonials: [
    { text: 'Timi captured our wedding with such artistry. Every frame feels alive and honest.', name: 'Amara Okafor', role: 'Wedding Client', avatar: img(7) },
    { text: 'The most effortless shoot I have ever done. The results spoke louder than any copy could.', name: 'Lukas Meyer', role: 'Creative Director', avatar: img(8) },
    { text: 'Genuine, patient and ridiculously talented. Our family session felt like play.', name: 'Sofia Bianchi', role: 'Family Session', avatar: img(9) },
  ] as Testimonial[],

  faqs: [
    { q: 'How do I book a session?', a: 'Reach out via the contact form or email, share your vision and preferred dates, and I will send a tailored proposal within 48 hours.' },
    { q: 'What is included in a shoot?', a: 'Pre-shoot planning, the session itself, professional retouching and a private online gallery with high-resolution downloads.' },
    { q: 'How long until I get my photos?', a: 'Edited galleries are delivered within 7 to 14 days depending on the scope of the project.' },
    { q: 'Do you travel for shoots?', a: 'Absolutely — I work across Nigeria and the Netherlands, and I am available worldwide for the right project.' },
    { q: 'Can I order prints?', a: 'Yes, fine-art prints and albums are available as add-ons in premium quality, hand-checked before shipping.' },
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
      title: 'Every Frame Tells a Story: Let’s Talk',
      email: 'hello@timijoel.com',
      socials: ['Instagram', 'Dribbble', 'Behance'],
    },
    theme: {}, // accents/géométrie/palette DA restent dans les composants
  },
  pages: [
    {
      slug: '/',
      type: 'home',
      title: 'Target — Photographer',
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
        title: 'My Works',
        intro: 'A selected body of recent work — editorials, outdoor lifestyle and brand stories.',
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
        title: 'Let’s start a project',
        intro: 'Tell me about your project and preferred dates — I reply within 48 hours.',
        email: 'hello@timijoel.com',
        zones: ['Nigeria', 'Netherlands', 'Worldwide on request'],
        pricing: [
          { name: 'Portrait Session', price: 'from €350', detail: '1h studio or outdoor, 20 retouched photos' },
          { name: 'Events & Outdoor', price: 'from €1 500', detail: 'Half/full-day coverage, private gallery' },
          { name: 'Brand & Commercial', price: 'on quote', detail: 'Shoot, retouch & color grade, usage rights' },
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
