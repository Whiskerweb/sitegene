// lib/foundry/library/artisans-a.ts
// LOT PILOTE d'extraction — sites/artisans : Plumber Pro « Aqualis » (page
// complète), Plumber Modern « BlueDrop » et Plumber Emergency (navbar + hero).
// 14 pièces pour valider la chaîne complète avant l'extraction massive.
import type { ComponentManifest } from "../types";
import { VIBE_IDS } from "../vibes";

const M = (m: Omit<ComponentManifest, "vibes" | "allowedSkinKeys">): ComponentManifest => ({
  ...m,
  vibes: VIBE_IDS,
  allowedSkinKeys: ["accent", "surface"],
});

export const manifests: Record<string, ComponentManifest> = {
  // --- Plumber Pro (Aqualis) — page complète -------------------------------
  "plumber-pro-navbar": M({
    id: "plumber-pro-navbar",
    role: "navbar",
    rarity: "common",
    description:
      "(Plumber Pro) Topbar encre infos pratiques (téléphone, horaires, zone) + nav sticky claire : logo carré accent, liens soulignés au survol, téléphone en pastille et CTA pilule.",
    whenToUse: ["artisan/service avec urgences téléphoniques", "site qui doit rassurer dès l'en-tête"],
    contentKeys: ["brand", "links", "cta"],
  }),
  "plumber-pro-hero": M({
    id: "plumber-pro-hero",
    role: "hero",
    rarity: "rare",
    description:
      "(Plumber Pro) Hero plein écran sur panneau encre : photo en fond avec parallaxe au scroll et voile dégradé, eyebrow en pilule contour, titre XL, CTA + compteur d'avis.",
    whenToUse: ["métier de confiance/intervention", "première impression forte avec photo terrain"],
    contentKeys: ["title", "tagline", "cta", "image"],
  }),
  "plumber-pro-intro": M({
    id: "plumber-pro-intro",
    role: "about",
    rarity: "common",
    description:
      "(Plumber Pro) À propos en 2 colonnes : grande photo à parallaxe à gauche, label + titre + mini-stats (années, certifications, urgence) + CTA à droite.",
    whenToUse: ["présenter l'entreprise avec des preuves chiffrées", "section à propos d'artisan"],
    contentKeys: ["title", "stats", "image"],
  }),
  "plumber-pro-services": M({
    id: "plumber-pro-services",
    role: "services",
    rarity: "common",
    description:
      "(Plumber Pro) Services en liste : heading + CTA à gauche, rangées de cartes blanches à droite (icône ronde, titre, description, flèche au survol) sur fond card.",
    whenToUse: ["3 à 5 prestations à détailler", "métier d'intervention (plombier, électricien…)"],
    contentKeys: ["title", "items"],
  }),
  "plumber-pro-process": M({
    id: "plumber-pro-process",
    role: "process",
    rarity: "common",
    description:
      "(Plumber Pro) Étapes du parcours sur panneau encre : 4 cartes semi-transparentes numérotées, icône ronde claire, textes clairs.",
    whenToUse: ["expliquer le déroulé d'une intervention", "rassurer sur la méthode"],
    contentKeys: ["title", "items"],
  }),
  "plumber-pro-stats": M({
    id: "plumber-pro-stats",
    role: "stats",
    rarity: "common",
    description:
      "(Plumber Pro) Chiffres clés en bandeau : grandes valeurs accent/encre sur fond surface, séparateur haut, statique et sobre.",
    whenToUse: ["preuve sociale chiffrée discrète", "entre deux sections riches"],
    contentKeys: ["title", "items"],
  }),
  "plumber-pro-testimonials": M({
    id: "plumber-pro-testimonials",
    role: "reviews",
    rarity: "common",
    description:
      "(Plumber Pro) Avis clients en grille de cartes blanches sur fond card : étoiles accent, citation, auteur et rôle.",
    whenToUse: ["au moins 3 avis clients", "bloc avis classique et lisible"],
    contentKeys: ["title", "items"],
  }),
  "plumber-pro-faq": M({
    id: "plumber-pro-faq",
    role: "faq",
    rarity: "common",
    description:
      "(Plumber Pro) FAQ en accordéon une colonne : icône + qui pivote en ×, réponse dépliée animée, séparateurs fins.",
    whenToUse: ["lever les objections avant contact", "4 à 6 questions fréquentes"],
    contentKeys: ["title", "items"],
  }),
  "plumber-pro-cta": M({
    id: "plumber-pro-cta",
    role: "cta",
    rarity: "common",
    description:
      "(Plumber Pro) Bandeau de conversion sur panneau accent : titre + sous-titre, bouton clair et numéro de téléphone, cercles décoratifs en arrière-plan.",
    whenToUse: ["pousser à l'action en fin de page", "mettre en avant le téléphone"],
    contentKeys: ["title", "button"],
  }),
  "plumber-pro-footer": M({
    id: "plumber-pro-footer",
    role: "footer",
    rarity: "common",
    description:
      "(Plumber Pro) Footer encre : marque + tagline, 3 colonnes de liens, copyright centré.",
    whenToUse: ["clôture de page d'artisan/service"],
    contentKeys: ["brand", "columns", "copyright"],
  }),

  // --- Plumber Modern (BlueDrop) -------------------------------------------
  "plumber-modern-navbar": M({
    id: "plumber-modern-navbar",
    role: "navbar",
    rarity: "common",
    description:
      "(Plumber Modern) Nav transparente posée SUR le hero coloré (texte blanc) : logo rond, liens soulignés au survol, CTA pilule encre avec point lumineux.",
    whenToUse: ["hero coloré pleine largeur juste en dessous", "en-tête léger et contemporain"],
    contentKeys: ["brand", "links", "cta"],
  }),
  "plumber-modern-hero": M({
    id: "plumber-modern-hero",
    role: "hero",
    rarity: "rare",
    description:
      "(Plumber Modern) Hero bicolore sur fond accent : badge étoilé, titre en trois lignes, CTA clair, preuve sociale à avatars empilés, grande photo arrondie à droite.",
    whenToUse: ["marque de service moderne et chaleureuse", "preuve sociale forte (avis, clients)"],
    contentKeys: ["titleA", "titleB", "titleC", "tagline", "cta", "image"],
  }),

  // --- Plumber Emergency -----------------------------------------------------
  "plumber-emergency-navbar": M({
    id: "plumber-emergency-navbar",
    role: "navbar",
    rarity: "common",
    description:
      "(Plumber Emergency) Nav claire et directe : marque encre, liens soulignés accent2 au survol, CTA contour encre qui s'inverse au survol.",
    whenToUse: ["site d'urgence/intervention", "en-tête sobre à CTA contour"],
    contentKeys: ["brand", "links", "cta"],
  }),
  "plumber-emergency-hero": M({
    id: "plumber-emergency-hero",
    role: "hero",
    rarity: "rare",
    description:
      "(Plumber Emergency) Hero 2 colonnes : soulignement décoratif SVG accent2 sous le titre XL, CTA arrondi + mention de disponibilité, photo à droite avec carte client flottante.",
    whenToUse: ["urgences 24/7 à mettre en avant", "hero avec preuve client incarnée"],
    contentKeys: ["title", "tagline", "cta", "image"],
  }),
};

export const samples: Record<string, Record<string, unknown>> = {
  "plumber-pro-navbar": {
    brand: "Aqualis",
    links: ["Accueil", "À propos", "Services", "Réalisations", "Contact"],
    cta: "Nous contacter",
    phone: "+33 1 80 05 55 76",
    topbarPhone: "(01) 23 45 67 89",
    topbarHours: "08h00 – 19h00",
    topbarArea: "Île-de-France et alentours",
  },
  "plumber-pro-hero": {
    eyebrow: "Spécialistes plomberie certifiés",
    title: "Des services de plomberie sur lesquels vous pouvez compter",
    tagline:
      "Une plomberie fiable, abordable et disponible 24/7 pour tous vos besoins, à la maison comme en entreprise.",
    cta: "Prendre rendez-vous",
    reviews: "8K+",
    reviewsLabel: "Avis clients",
    image: "/_templates/plumber-pro/img/hero.jpg",
  },
  "plumber-pro-intro": {
    label: "Qui sommes-nous",
    title: "Votre partenaire plomberie de confiance",
    sideTitle: "Une équipe à votre écoute",
    sideText: "Des artisans qualifiés, des délais tenus et un travail soigné, depuis plus de dix ans.",
    cta: "En savoir plus",
    stats: [
      { value: "12+", label: "Années d'expérience" },
      { value: "4+", label: "Certifications" },
      { value: "24/7", label: "Service d'urgence" },
    ],
    image: "/_templates/plumber-pro/img/intro.jpg",
  },
  "plumber-pro-services": {
    label: "Nos services",
    title: "Des solutions de plomberie fiables",
    subtitle: "Notre équipe qualifiée gère tout, des fuites aux installations, avec précision et durabilité.",
    cta: "Voir tous les services",
    items: [
      { title: "Dépannage d'urgence", desc: "Intervention rapide 24/7 pour les fuites et ruptures.", icon: "drop" },
      { title: "Débouchage canalisations", desc: "Service rapide pour bouchons et obstructions.", icon: "wrench" },
      { title: "Installation & remplacement", desc: "Solutions d'installation livrées dans les délais.", icon: "pipe" },
      { title: "Chauffe-eau & ballon", desc: "Réparations rapides pour vos problèmes de chauffe-eau.", icon: "heater" },
    ],
  },
  "plumber-pro-process": {
    label: "Comment ça marche",
    title: "Un parcours simple, sans surprise",
    subtitle: "De la réservation à la réparation, tout est pensé pour vous simplifier la vie.",
    cta: "Réserver maintenant",
    items: [
      { title: "Réservez un service", desc: "Planifiez votre intervention en ligne en quelques étapes simples." },
      { title: "Recevez un diagnostic", desc: "Nos plombiers arrivent à l'heure et proposent la meilleure solution." },
      { title: "On répare", desc: "Nous intervenons avec des outils de qualité pour une réparation durable." },
      { title: "L'esprit tranquille", desc: "Avec notre garantie, votre plomberie est entre de bonnes mains." },
    ],
  },
  "plumber-pro-stats": {
    label: "En chiffres",
    title: "La confiance se mesure",
    subtitle: "Quelques repères sur notre activité.",
    items: [
      { value: "8K+", label: "Avis clients" },
      { value: "12+", label: "Années d'expérience" },
      { value: "98%", label: "Clients satisfaits" },
    ],
  },
  "plumber-pro-testimonials": {
    label: "Témoignages",
    title: "Ce que disent nos clients",
    items: [
      { quote: "Une équipe remarquable, intervention rapide et propre. Je recommande vivement !", author: "Julien Caron", role: "Propriétaire", rating: 4 },
      { quote: "Technicien courtois et très soigneux, tout est parfait.", author: "Olivia Bonnet", role: "Gestionnaire", rating: 4 },
      { quote: "Devis clair, délais tenus, résultat impeccable du premier coup.", author: "Sarah Lemoine", role: "Particulier", rating: 5 },
    ],
  },
  "plumber-pro-faq": {
    label: "FAQ",
    title: "Les questions fréquentes",
    subtitle: "Tout ce qu'il faut savoir avant de réserver.",
    items: [
      { question: "Comment prendre rendez-vous ?", answer: "La réservation en ligne ne prend que quelques minutes. Choisissez votre service, sélectionnez une date et confirmez instantanément." },
      { question: "Intervenez-vous vraiment 24/7 en urgence ?", answer: "Oui — notre service d'urgence est disponible jour et nuit, week-ends compris, pour les fuites et ruptures de canalisation." },
      { question: "Vos plombiers sont-ils certifiés ?", answer: "Tous nos plombiers sont qualifiés, certifiés et assurés. Chacun suit une formation continue avant d'intervenir." },
    ],
  },
  "plumber-pro-cta": {
    title: "Un souci de plomberie ? On s'en occupe.",
    subtitle: "Prenez rendez-vous en ligne ou appelez-nous — intervention rapide garantie.",
    button: "Prendre rendez-vous",
    phone: "+33 1 80 05 55 76",
  },
  "plumber-pro-footer": {
    brand: "Aqualis",
    tagline: "La plomberie fiable, du dépannage à l'installation.",
    columns: [
      { heading: "Entreprise", links: ["Accueil", "À propos", "Blog"] },
      { heading: "Services", links: ["Urgence 24/7", "Débouchage", "Installation"] },
      { heading: "Légal", links: ["Politique de confidentialité", "Conditions générales"] },
    ],
    copyright: "© Aqualis. Tous droits réservés.",
  },
  "plumber-modern-navbar": {
    brand: "BlueDrop",
    links: ["Accueil", "À propos", "Services", "Contact"],
    cta: "Appelez-nous : 01 86 95 99 43",
  },
  "plumber-modern-hero": {
    badge: "Noté 4,9 par nos clients satisfaits",
    titleA: "Tous vos besoins",
    titleB: "en plomberie",
    titleC: "pour votre maison",
    tagline:
      "Nous couvrons tous vos besoins de plomberie pour garder votre maison sûre, confortable et sereine.",
    cta: "Réserver une consultation gratuite",
    proof: "Plus de 10 000 particuliers nous font confiance",
    avatars: [
      "/_templates/plumber-modern/img/team-1.jpg",
      "/_templates/plumber-modern/img/team-2.jpg",
      "/_templates/plumber-modern/img/team-3.jpg",
    ],
    image: "/_templates/plumber-modern/img/hero.jpg",
  },
  "plumber-emergency-navbar": {
    brand: "HydroSecours",
    links: ["Accueil", "Services", "Tarifs", "Contact"],
    cta: "Urgence 24/7",
  },
  "plumber-emergency-hero": {
    title: "Plombiers d'urgence, à votre porte en 30 minutes",
    tagline: "Fuites, ruptures, débordements : une équipe disponible jour et nuit, week-ends compris.",
    cta: "Appeler maintenant",
    availability: "Disponible 24h/24, 7j/7",
    customerName: "Camille Robert",
    customerRole: "Cliente depuis 2022",
    customerAvatar: "/_templates/plumber-emergency/img/av2.jpg",
    image: "/_templates/plumber-emergency/img/hero.jpg",
  },
};
