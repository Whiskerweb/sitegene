// Contenu centralisé du site Potozon — studio créatif « a new dimension ».
// DA : pop / éditorial / kinetic brutalism. Palette poto, fond clair, titres oversized.
//
// RUNTIME ADAPTER : tout le contenu vit dans DEFAULT_CONTENT. À l'exécution, si
// `window.__SITE_CONTENT__` existe (injecté par la plateforme), il REMPLACE
// DEFAULT_CONTENT (même forme exacte). Les composants importent les exports
// nommés ci-dessous — aucun changement de composant n'est nécessaire.

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
  color: string
}

export interface Work {
  date: string
  category: string
  title: string
  desc: string
  img: string
  color: string
}

export interface Testimonial { text: string; name: string; role: string; avatar: string }

export interface Faq { q: string; a: string }

export interface GalleryCard {
  img: string
  color: string // couleur de fond (DA), teinte la photo via mix-blend
  rotate: string
  marginTop: string
}

/* ------------------------------------------------------------------ */
/* Contenu par défaut (forme = objet injecté par la plateforme)        */
/* ------------------------------------------------------------------ */
const DEFAULT_CONTENT = {
  // Navigation. Chaque libellé pointe vers #<libellé en minuscules>.
  // Sections présentes : about, portfolio, projects, studio, contact.
  navItems: ['About', 'Portfolio', 'Projects', 'Studio'] as string[],

  // Hero (wording conservé)
  hero: {
    line1: 'Experience',
    line2: 'Photography',
    sticker: 'A new dimension',
    ribbon: 'Beautifull',
  },

  // Citation mise en avant
  featuredQuote: {
    text: 'Potozon turned our shoot into a whole new dimension. Every frame feels loud, alive and unmistakably ours.',
    name: 'Mara K.',
    role: 'Creative Director',
    avatar: img(7),
    images: [img(4), img(12)],
  },

  // Grand texte révélé au scroll
  scrollText:
    'We are Potozon — a studio that treats photography as a new dimension. Color, motion and bold framing, captured loud and timeless.',

  // Mots à mettre en couleur dans le texte révélé (accent hiérarchie)
  scrollAccents: {
    Potozon: 'orange',
    'dimension.': 'purple',
    loud: 'red',
    Color: 'yellow',
  } as Record<string, 'red' | 'yellow' | 'orange' | 'purple'>,

  // Services (accordéon)
  servicesIntro:
    'From portraits to brand worlds, every service is shot the Potozon way — bold, colorful, alive.',
  services: [
    {
      n: '01',
      name: 'Portrait Sessions',
      desc: 'Timeless portraits that reveal personality, mood and the quiet story behind every face — pushed into vivid color.',
      tags: ['Studio', 'Editorial', 'Headshots'],
      img: img(1),
      color: '#E5412A',
    },
    {
      n: '02',
      name: 'Events & Outdoor',
      desc: 'Candid, high-energy coverage of weddings, drops and outdoor moments captured exactly as they happen.',
      tags: ['Weddings', 'Concerts', 'Travel'],
      img: img(5),
      color: '#FFC400',
    },
    {
      n: '03',
      name: 'Family Worlds',
      desc: 'Warm, playful family moments captured in light that feels soft, intimate and honest.',
      tags: ['Newborn', 'Lifestyle', 'Generations'],
      img: img(4),
      color: '#F15A24',
    },
    {
      n: '04',
      name: 'Retouch & Grade',
      desc: 'Refined post-production and signature color grading that elevates every image while keeping it real.',
      tags: ['Color Grade', 'Skin Retouch', 'Composites'],
      img: img(2),
      color: '#A99BE8',
    },
    {
      n: '05',
      name: 'Brand & Commercial',
      desc: 'Bring your products and brand stories to life through powerful, scroll-stopping visuals.',
      tags: ['Product', 'Campaigns', 'Content'],
      img: img(6),
      color: '#8B7CF6',
    },
  ] as Service[],

  // Marquee « collaborations »
  collaborations: [
    'VOGUE', 'NIKE', 'AIRBNB', 'SPOTIFY', 'CANON', 'GUCCI', 'APPLE', 'LEICA',
  ] as string[],

  // Works (grille projets)
  works: [
    { date: 'January 2026', category: 'Fashion Editorial', title: 'Denim Reimagined', desc: 'A fashion editorial exploring denim beyond its traditional form — texture, color and versatility.', img: img(3), color: '#E5412A' },
    { date: 'December 2025', category: 'Family Worlds', title: "Zoe's Beginnings", desc: 'The earliest moments of life captured in a calm, cozy setting with soft natural light.', img: img(4), color: '#FFC400' },
    { date: 'November 2025', category: 'Outdoor Lifestyle', title: 'Morning in Motion', desc: 'A sunrise lifestyle shoot highlighting natural light and candid expressions.', img: img(5), color: '#A99BE8' },
    { date: 'October 2025', category: 'Brand & Commercial', title: 'Gaia Essence', desc: 'A brand-focused editorial inspired by nature, warmth and organic beauty.', img: img(6), color: '#F15A24' },
  ] as Work[],

  // Stats + CTA « beyond the frame »
  beyond: {
    title: 'Capture Beyond the Frame',
    body: 'Photography, for us, is more than an image — it is a feeling preserved. We chase light, color and the unrepeatable in-between moments that make a story worth telling.',
    cta: 'Start a project',
    stats: [
      { v: '12+', l: 'Years shooting', color: '#E5412A' },
      { v: '450', l: 'Projects delivered', color: '#FFC400' },
      { v: '38', l: 'Awards & features', color: '#A99BE8' },
    ],
  },

  // Témoignages
  testimonials: [
    { text: 'Potozon captured our wedding with such artistry. Every frame feels alive and honest.', name: 'Amara Okafor', role: 'Wedding Client', avatar: img(7) },
    { text: 'The most effortless shoot I have ever done. The results spoke louder than any copy could.', name: 'Lukas Meyer', role: 'Creative Director', avatar: img(8) },
    { text: 'Genuine, patient and ridiculously talented. Our family session felt like play.', name: 'Sofia Bianchi', role: 'Family Session', avatar: img(9) },
  ] as Testimonial[],

  // FAQ (accordéon)
  faqs: [
    { q: 'How do I book a session?', a: 'Reach out via email, share your vision and preferred dates, and we send a tailored proposal within 48 hours.' },
    { q: 'What is included in a shoot?', a: 'Pre-shoot planning, the session itself, signature color grading and a private online gallery with high-resolution downloads.' },
    { q: 'How long until I get my photos?', a: 'Edited galleries are delivered within 7 to 14 days depending on the scope of the project.' },
    { q: 'Do you travel for shoots?', a: 'Absolutely — we work everywhere and are available worldwide for the right project.' },
    { q: 'Can I order prints?', a: 'Yes, fine-art prints and albums are available as add-ons in premium quality, hand-checked before shipping.' },
  ] as Faq[],

  // Galerie « OurGallery » (cartes teintées)
  textLeft:
    'Photography is the art, application, and practice of creating durable images.',
  textRight: {
    body: "The International Center of Photography in New York City is the world's.",
    cta: 'READ MORE',
  },
  cards: [
    { img: 'img/c1.jpg', color: '#E5412A', rotate: '-3deg', marginTop: '0px' },
    { img: 'img/c2.jpg', color: '#FFC400', rotate: '2deg', marginTop: '40px' },
    { img: 'img/c3.jpg', color: '#F15A24', rotate: '-2deg', marginTop: '8px' },
    { img: 'img/c4.jpg', color: '#A99BE8', rotate: '3deg', marginTop: '48px' },
  ] as GalleryCard[],

  // Footer
  footer: {
    title: 'Every Frame Tells a Story. Let’s Talk.',
    email: 'hello@potozon.studio',
    socials: ['Instagram', 'Dribbble', 'Behance'],
  },
}

/* ------------------------------------------------------------------ */
/* Sélection runtime : global injecté > défaut                         */
/* ------------------------------------------------------------------ */
const C =
  typeof window !== 'undefined' && (window as any).__SITE_CONTENT__
    ? ((window as any).__SITE_CONTENT__ as typeof DEFAULT_CONTENT)
    : DEFAULT_CONTENT

// Exposé pour la plateforme (dump des contenus par défaut → default-content.json).
export const __DEFAULT_CONTENT__ = DEFAULT_CONTENT

/* ------------------------------------------------------------------ */
/* Re-exports (noms/types identiques à l'origine)                      */
/* ------------------------------------------------------------------ */
export const navItems = C.navItems
export const hero = C.hero
export const featuredQuote = C.featuredQuote
export const scrollText = C.scrollText
export const scrollAccents: Record<string, 'red' | 'yellow' | 'orange' | 'purple'> = C.scrollAccents
export const servicesIntro = C.servicesIntro
export const services: Service[] = C.services
export const collaborations = C.collaborations
export const works: Work[] = C.works
export const beyond = C.beyond
export const testimonials: Testimonial[] = C.testimonials
export const faqs: Faq[] = C.faqs
export const textLeft = C.textLeft
export const textRight = C.textRight
export const cards: GalleryCard[] = C.cards
export const footer = C.footer
