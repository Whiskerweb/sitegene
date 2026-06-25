// lib/foundry/hero-router.ts
// Résolution du composant hero (et des navbars) adapté au couple (métier, DA).
// Importé par agenceur.ts pour filtrer le catalogue et guider Mistral.
import type { VibeId } from "./types";
import type { TradeId } from "./da-personas";

/** Heroes disponibles par métier (ordre : recommandé en premier). */
const TRADE_HERO_OPTIONS: Record<TradeId, string[]> = {
  musicien:    ["jazz-vocalist-hero", "creative-portfolio-hero", "bold-stack-hero", "studio-portfolio-hero", "bold-type-hero", "hero-drop"],
  photographe: ["studio-portfolio-hero", "luxury-wedding-hero", "marquee-hero", "bold-type-hero"],
  artisan:     ["electrician-pro-hero", "multi-trade-hero", "plumber-pro-hero"],
  coach:       ["hero-split-asym"],
  "bien-etre": ["hero-split-asym"],
  restaurant:  ["hero-split-asym"],
  beaute:      ["hero-split-asym"],
  conseil:     ["hero-split-asym", "bold-type-hero"],
  fitness:     ["hero-split-asym", "bold-type-hero"],
  autre:       ["hero-split-asym", "bold-type-hero"],
};

/** Override : vibeId → trade → hero recommandé (prime sur le premier de la liste). */
const VIBE_HERO_OVERRIDE: Partial<Record<VibeId, Partial<Record<TradeId, string>>>> = {
  "rock-brutalist":         { musicien: "creative-portfolio-hero" },
  "lexicon-creators":       { musicien: "creative-portfolio-hero", artisan: "multi-trade-hero" },
  "rap-luxe":               { musicien: "bold-stack-hero" },
  // DA sombres / club / électro → le hero « drop » (titre condensé XXL + barre streaming).
  "volt-graphite":          { musicien: "hero-drop" },
  "arena-rouge":            { musicien: "hero-drop" },
  "acier-brique":           { musicien: "hero-drop" },
  "noir-argentique":        { musicien: "hero-drop" },
  "contemporain-editorial": { musicien: "jazz-vocalist-hero", photographe: "luxury-wedding-hero" },
  "warm-serif":             { photographe: "luxury-wedding-hero" },
  "encre-editoriale":       { photographe: "luxury-wedding-hero" },
  "photographe-galerie":    { photographe: "studio-portfolio-hero" },
  "mindful-moments":        { artisan: "multi-trade-hero" },
};

/** Navbars adaptées par métier (ordre : recommandé en premier). */
const TRADE_NAVBAR_OPTIONS: Record<TradeId, string[]> = {
  musicien:    ["ink-bar-navbar", "split-wordmark-navbar"],
  photographe: ["wordmark-navbar", "studio-clock-navbar"],
  artisan:     ["app-bar-navbar", "glass-pill-navbar"],
  coach:       ["glass-pill-navbar", "app-bar-navbar"],
  "bien-etre": ["glass-pill-navbar", "app-bar-navbar"],
  restaurant:  ["glass-pill-navbar", "wordmark-navbar"],
  beaute:      ["glass-pill-navbar", "wordmark-navbar"],
  conseil:     ["app-bar-navbar", "glass-pill-navbar"],
  fitness:     ["app-bar-navbar", "glass-pill-navbar"],
  autre:       ["glass-pill-navbar", "app-bar-navbar"],
};

/** Sections très spécialisées plombier — hors-contexte pour tous sauf artisan. */
const PLUMBER_ONLY = new Set([
  "plumber-pro-navbar", "plumber-modern-navbar", "plumber-emergency-navbar",
  "plumber-pro-intro", "plumber-pro-services", "plumber-pro-process",
  "plumber-pro-stats", "plumber-pro-testimonials", "plumber-pro-faq",
  "plumber-pro-cta", "plumber-pro-footer",
]);

/** Heroes hors-contexte par métier. */
const HERO_BLACKLIST: Record<TradeId, Set<string>> = {
  musicien:    new Set(["luxury-wedding-hero", "wedding-warm-hero", "electrician-pro-hero", "multi-trade-hero", "plumber-pro-hero", "plumber-modern-hero", "plumber-emergency-hero"]),
  photographe: new Set(["jazz-vocalist-hero", "creative-portfolio-hero", "bold-stack-hero", "electrician-pro-hero", "multi-trade-hero", "plumber-pro-hero", "plumber-modern-hero", "plumber-emergency-hero"]),
  artisan:     new Set(["jazz-vocalist-hero", "creative-portfolio-hero", "bold-stack-hero", "studio-portfolio-hero", "luxury-wedding-hero", "wedding-warm-hero", "marquee-hero", "bold-type-hero"]),
  coach:       new Set(["jazz-vocalist-hero", "creative-portfolio-hero", "bold-stack-hero", "studio-portfolio-hero", "luxury-wedding-hero", "wedding-warm-hero", "electrician-pro-hero", "multi-trade-hero", "plumber-pro-hero", "plumber-modern-hero", "plumber-emergency-hero", "bold-type-hero"]),
  "bien-etre": new Set(["jazz-vocalist-hero", "creative-portfolio-hero", "bold-stack-hero", "studio-portfolio-hero", "luxury-wedding-hero", "wedding-warm-hero", "electrician-pro-hero", "multi-trade-hero", "plumber-pro-hero", "plumber-modern-hero", "plumber-emergency-hero", "bold-type-hero"]),
  restaurant:  new Set(["jazz-vocalist-hero", "creative-portfolio-hero", "bold-stack-hero", "studio-portfolio-hero", "luxury-wedding-hero", "wedding-warm-hero", "electrician-pro-hero", "multi-trade-hero", "plumber-pro-hero", "plumber-modern-hero", "plumber-emergency-hero", "bold-type-hero"]),
  beaute:      new Set(["jazz-vocalist-hero", "creative-portfolio-hero", "bold-stack-hero", "studio-portfolio-hero", "luxury-wedding-hero", "wedding-warm-hero", "electrician-pro-hero", "multi-trade-hero", "plumber-pro-hero", "plumber-modern-hero", "plumber-emergency-hero", "bold-type-hero"]),
  conseil:     new Set(["jazz-vocalist-hero", "creative-portfolio-hero", "bold-stack-hero", "studio-portfolio-hero", "luxury-wedding-hero", "wedding-warm-hero", "electrician-pro-hero", "multi-trade-hero", "plumber-pro-hero", "plumber-modern-hero", "plumber-emergency-hero"]),
  fitness:     new Set(["jazz-vocalist-hero", "creative-portfolio-hero", "bold-stack-hero", "studio-portfolio-hero", "luxury-wedding-hero", "wedding-warm-hero", "electrician-pro-hero", "multi-trade-hero", "plumber-pro-hero", "plumber-modern-hero", "plumber-emergency-hero"]),
  autre:       new Set(["jazz-vocalist-hero", "studio-portfolio-hero", "luxury-wedding-hero", "wedding-warm-hero", "electrician-pro-hero", "multi-trade-hero", "plumber-pro-hero", "plumber-modern-hero", "plumber-emergency-hero"]),
};

/** Navbars hors-contexte pour tous les métiers sauf leur liste propre. */
const NAVBAR_TRADE_SETS: Record<TradeId, Set<string>> = Object.fromEntries(
  Object.entries(TRADE_NAVBAR_OPTIONS).map(([t, ids]) => [t, new Set(ids)])
) as Record<TradeId, Set<string>>;

// --- Affinité section ↔ métier (sections de contenu, pas hero/navbar) ----------
// Le catalogue Mistral est piloté par de la PROSE (description + « quand l'utiliser »).
// Pour qu'il comprenne quelles sections vont — ou ne vont PAS — à un métier, on
// annote ici, de façon centralisée (comme TRADE_HERO_OPTIONS / HERO_BLACKLIST) :
//  - EXCLUDE : sections retirées du catalogue (Mistral ne peut pas les choisir).
//  - PRIORITY : sections pertinentes, taguées « adapté à ce métier » avec un
//    indice d'usage concret (ce que la section doit porter pour ce métier).

/** Sections de CONTENU hors-sujet pour un métier — exclues du catalogue.
 *  Un musicien fait un site VITRINE (musique, scène, presse) : pas d'avis
 *  clients, pas de FAQ, pas de « process » ni de forfaits comme un prestataire. */
const TRADE_SECTION_EXCLUDE: Partial<Record<TradeId, Set<string>>> = {
  musicien: new Set([
    // Avis clients : hors-codes pour un artiste (sa crédibilité = presse, écoutes,
    // salles & festivals — pas des témoignages de clients). Une citation presse
    // passe par "quote-spotlight" (rôle statement), qui reste disponible.
    "testimonials-carousel", "reviews-postit-carousel", "testimonials-marquee",
    "liquid-reviews-marquee", "fx-circular-reviews", "fx-stagger-reviews", "fx-shuffle-reviews",
    // FAQ / parcours en étapes / forfaits : codes de prestataire, pas de musicien.
    "faq-accordion", "process-steps", "pricing-cards",
  ]),
  // Un restaurant / un salon de beauté n'a pas de « déroulé d'intervention »
  // (process-steps = code prestataire B2B). Le reste de leur catalogue est gardé
  // (pricing, galerie, location… restent disponibles et priorisés).
  restaurant: new Set(["process-steps"]),
  beaute: new Set(["process-steps"]),
};

/** Sections particulièrement PERTINENTES pour un métier → id : indice d'usage.
 *  L'indice est injecté dans le catalogue (« adapté à ce métier : … ») pour que
 *  Mistral privilégie la section ET sache quel contenu y mettre. */
const TRADE_SECTION_PRIORITY: Partial<Record<TradeId, Record<string, string>>> = {
  musicien: {
    "release-grid": "discographie en grille de pochettes (albums / EP / singles) avec titre + année — section dédiée musique",
    "tour-dates": "agenda / dates de tournée en tableau (date + ville + salle), gros titre/hashtag — section dédiée concerts",
    "artist-statement": "phrase-manifeste de l'artiste + portrait + pastilles de plateformes d'écoute",
    "booking-cta": "booker l'artiste : appel à l'action immersif plein écran (e-mail / contact de booking)",
    "social-clip-links": "liens d'écoute & réseaux (Spotify, Deezer, Apple Music, SoundCloud, Bandcamp, YouTube, Instagram) — section clé d'un site d'artiste",
    "logo-marquee": "salles, festivals & labels qui l'ont programmé (crédibilité scène, à la place d'avis clients)",
    "carousel-cards": "discographie : albums / EP / singles avec pochette et année",
    "image-marquee": "galerie de pochettes / visuels qui défile",
    "gallery-mosaic": "photos de scène, de studio ou de presse",
    "scroll-velocity-gallery": "mur de photos live, immersif",
    "expand-gallery": "galerie de visuels interactive",
    "parallax-strip": "grande photo de concert immersive entre deux sections",
    "story-timeline": "agenda / dates de concerts & tournée (date + salle + ville)",
    "stats-countup": "écoutes mensuelles, concerts joués, années de scène (preuve par les chiffres)",
    "intro-split": "bio de l'artiste ou du groupe : qui il est, son univers, son parcours",
    "team-showcase": "membres du groupe (visages + réseaux de chacun)",
    "quote-spotlight": "une phrase-manifeste de l'artiste, ou une citation de la presse",
    "marquee-words": "genres, influences, villes de tournée en bandeau",
    "cta-banner": "écouter le dernier titre / réserver des places (billetterie, si le client la mentionne)",
  },
  photographe: {
    "gallery-mosaic": "portfolio en mosaïque (mariages, portraits, réalisations) — LA section centrale d'un photographe",
    "expand-gallery": "galerie interactive : l'image survolée s'agrandit — quelques clichés forts",
    "scroll-velocity-gallery": "mur de photos immersif qui réagit au scroll — univers visuel",
    "carousel-cards": "réalisations légendées (le type de shooting par image)",
    "parallax-strip": "grande photo d'ambiance immersive entre deux sections",
    "intro-split": "qui vous êtes + votre style / univers visuel (lumineux, argentique, éditorial…)",
    "services-rows": "vos prestations : mariage, portrait, corporate, immobilier — et ce que comprend chaque formule",
    "pricing-cards": "vos forfaits photo (séance / livrables / nombre de photos retouchées)",
    "stats-countup": "mariages couverts, années d'expérience, clients (crédibilité chiffrée)",
    "testimonials-carousel": "avis de couples / clients (la preuve sociale clé en mariage)",
    "faq-accordion": "questions fréquentes : déplacement, délais de livraison, droits d'image",
    "contact-block": "réserver une date / demander un devis (coordonnées + zone d'intervention)",
  },
  artisan: {
    "services-rows": "vos prestations : installation, dépannage, rénovation, entretien",
    "process-steps": "le déroulé d'une intervention (diagnostic → devis → réalisation → garantie)",
    "stats-countup": "années d'expérience, chantiers réalisés, clients satisfaits, délai moyen",
    "testimonials-carousel": "avis clients vérifiés (la confiance est clé pour un artisan)",
    "faq-accordion": "questions fréquentes : devis gratuit, délais, zone, garanties",
    "contact-block": "demander un devis gratuit / appeler en urgence (téléphone + zone d'intervention)",
    "intro-split": "votre entreprise : ancienneté, certifications (RGE, Qualibat), assurance décennale",
    "logo-marquee": "labels & certifications (RGE, Qualibat, Qualifelec) en bandeau de confiance",
    "gallery-mosaic": "réalisations / chantiers avant-après en images",
    "cta-banner": "rappel du téléphone / devis gratuit en bas de page",
  },
  coach: {
    "intro-split": "qui vous êtes + votre approche / méthode",
    "services-rows": "vos accompagnements (individuel, collectif, en ligne) et pour quel public",
    "process-steps": "comment se déroule une séance / le parcours d'accompagnement, étape par étape",
    "stats-countup": "personnes accompagnées, taux de satisfaction, années de pratique",
    "testimonials-carousel": "témoignages de transformation (la preuve est le cœur du métier)",
    "fx-floating-tags": "vos valeurs / piliers de méthode en pastilles flottantes (signature coach)",
    "pricing-cards": "vos formules (séance unique, pack, abonnement)",
    "faq-accordion": "objections fréquentes : durée, en visio, confidentialité, premier rendez-vous",
    "contact-block": "réserver un premier appel découverte (souvent offert)",
    "quote-spotlight": "une phrase-manifeste sur votre vision de l'accompagnement",
  },
  "bien-etre": {
    "services-rows": "vos pratiques / soins (yoga, massage, sophrologie, ateliers)",
    "fx-floating-tags": "vos bienfaits / valeurs (détente, équilibre, ancrage) — section signature bien-être",
    "intro-split": "votre approche + votre cadre (studio, à domicile, en visio)",
    "process-steps": "comment se déroule une séance / un accompagnement",
    "pricing-cards": "vos formules (séance, carte 5/10, abonnement)",
    "gallery-mosaic": "ambiance du lieu / des séances en images (apaisant)",
    "reviews-postit-carousel": "avis chaleureux de vos client·es",
    "faq-accordion": "questions : niveau requis, tenue, contre-indications, première séance",
    "contact-block": "réserver une séance / un premier échange",
    "quote-spotlight": "une intention / un manifeste de bien-être",
  },
  fitness: {
    "services-rows": "vos programmes / cours (perso, collectif, en ligne, prépa physique)",
    "process-steps": "comment démarrer (bilan → programme → suivi)",
    "stats-countup": "clients transformés, séances, années, % d'objectifs atteints",
    "gallery-mosaic": "transformations / avant-après / ambiance de la salle en images",
    "pricing-cards": "vos formules (séance, pack, abonnement mensuel)",
    "testimonials-carousel": "témoignages de transformations (la preuve est le moteur)",
    "fx-display-cards": "vos temps forts / résultats marquants en cartes",
    "intro-split": "qui vous êtes + votre méthode d'entraînement",
    "faq-accordion": "questions : niveau débutant, matériel, fréquence, résultats",
    "contact-block": "réserver une séance d'essai / un bilan",
  },
  restaurant: {
    "gallery-mosaic": "galerie de plats / de l'ambiance (donner envie visuellement)",
    "intro-split": "votre cuisine, votre histoire, votre chef",
    "services-rows": "vos formules / temps forts (menu midi, carte, dégustation, brunch)",
    "location-cards": "votre adresse + accès + bouton itinéraire (où vous trouver)",
    "parallax-strip": "grande photo d'ambiance immersive (salle, terrasse, plat signature)",
    "pricing-cards": "vos menus / formules avec prix (midi, soir, dégustation)",
    "testimonials-carousel": "avis de clients (Google / TripAdvisor reformulés)",
    "contact-block": "réserver une table (téléphone + horaires)",
    "cta-banner": "réserver maintenant",
    "carousel-cards": "plats signature légendés",
  },
  beaute: {
    "services-rows": "vos prestations (coupe, couleur, soin, manucure, maquillage)",
    "gallery-mosaic": "vos réalisations / avant-après (le visuel vend)",
    "pricing-cards": "vos tarifs par prestation / forfaits",
    "intro-split": "votre salon, votre univers, votre savoir-faire",
    "location-cards": "votre adresse + accès (où prendre rendez-vous)",
    "reviews-postit-carousel": "avis de vos client·es",
    "contact-block": "prendre rendez-vous (téléphone / lien de réservation)",
    "faq-accordion": "questions : durée, sur rendez-vous, produits utilisés, à domicile",
    "carousel-cards": "réalisations légendées",
    "cta-banner": "réserver votre rendez-vous",
  },
  conseil: {
    "outline-services-list": "vos expertises en typographie signature (premium, B2B)",
    "services-rows": "vos prestations / domaines d'intervention (alternative sobre)",
    "logo-marquee": "logos de clients / partenaires (preuve de confiance B2B)",
    "process-steps": "votre méthode / démarche d'accompagnement, en étapes",
    "stats-countup": "missions, clients, années, % de résultats",
    "sticky-stack-projects": "vos références / études de cas en pile immersive",
    "testimonials-carousel": "témoignages de clients / de dirigeants",
    "intro-split": "qui vous êtes + votre positionnement / approche",
    "faq-accordion": "questions : périmètre, format, tarification, premier échange",
    "contact-block": "prendre un premier rendez-vous / échange découverte",
    "pricing-cards": "vos offres / forfaits (si packagés)",
  },
};

/** Hero recommandé pour un couple (trade, vibeId). */
export function resolveHero(trade: TradeId, vibeId: string): string {
  const vibeOverride = VIBE_HERO_OVERRIDE[vibeId as VibeId];
  if (vibeOverride?.[trade]) return vibeOverride[trade]!;
  return TRADE_HERO_OPTIONS[trade]?.[0] ?? "hero-split-asym";
}

/** Liste des heroes à proposer à Mistral (recommandé en tête). */
export function heroOptionsForTrade(trade: TradeId, vibeId: string): string[] {
  const recommended = resolveHero(trade, vibeId);
  const options = TRADE_HERO_OPTIONS[trade] ?? ["hero-split-asym"];
  return [recommended, ...options.filter((id) => id !== recommended)];
}

/** Vrai si ce composant doit être exclu du catalogue pour ce métier. */
export function isExcludedForTrade(componentId: string, role: string, trade: TradeId): boolean {
  if (role === "hero") return HERO_BLACKLIST[trade]?.has(componentId) ?? false;
  if (role === "navbar") return !NAVBAR_TRADE_SETS[trade]?.has(componentId);
  if (PLUMBER_ONLY.has(componentId) && trade !== "artisan") return true;
  if (TRADE_SECTION_EXCLUDE[trade]?.has(componentId)) return true;
  return false;
}

/** Indice d'usage d'une section pour un métier (pour le catalogue Mistral).
 *  Chaîne vide si la section n'a pas d'usage métier particulier. */
export function tradeSectionHint(componentId: string, trade: TradeId): string {
  return TRADE_SECTION_PRIORITY[trade]?.[componentId] ?? "";
}
