// lib/foundry/vibes.ts
// Directions artistiques de la fonderie. Une vibe = palette + paire typographique
// + radius + ambiance. Les composants étant pilotés par CSS vars, toute vibe
// s'applique à tout composant ; la personnalité vient des tokens, jamais du markup.
// Surfaces volontairement CLAIRES (contraste garanti sur les 13 composants).
import type { Vibe, VibeId } from "./types";

const GF = "https://fonts.googleapis.com/css2";

export const VIBES: Record<VibeId, Vibe> = /* cast : 11 DA ajoutées en Task 3 */ ({
  "warm-serif": {
    id: "warm-serif",
    label: "Atelier chaleureux",
    mood: ["chaleureux", "humain", "artisanal"],
    mode: "light",
    fontHref: `${GF}?family=Castoro:ital@0;1&family=Nunito:wght@400;600;700;800&display=swap`,
    palette: { ink: "#0d0503", surface: "#fcfaf7", card: "#f8f3ec", accent: "#8d6959", accent2: "#e1937d", muted: "#70747a" },
    fonts: { heading: "Castoro, Georgia, serif", body: "Nunito, system-ui, sans-serif" },
    radius: { card: "24px", xl: "32px", pill: "999px" },
  },
  "sage-nature": {
    id: "sage-nature",
    label: "Sauge & lin",
    mood: ["apaisant", "naturel", "organique"],
    mode: "light",
    fontHref: `${GF}?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Outfit:wght@400;500;600;700&display=swap`,
    palette: { ink: "#1c2419", surface: "#f7faf4", card: "#ecf2e6", accent: "#5a7d52", accent2: "#c8a96e", muted: "#6f7a6a" },
    fonts: { heading: "Fraunces, Georgia, serif", body: "Outfit, system-ui, sans-serif" },
    radius: { card: "20px", xl: "28px", pill: "999px" },
  },
  "ocean-confiance": {
    id: "ocean-confiance",
    label: "Bleu de travail",
    mood: ["fiable", "net", "professionnel"],
    mode: "light",
    fontHref: `${GF}?family=Sora:wght@400;600;700&family=Inter:wght@400;500;600&display=swap`,
    palette: { ink: "#0c1626", surface: "#f6f9fc", card: "#e9f0f8", accent: "#2456e6", accent2: "#6ea8fe", muted: "#5d6b80" },
    fonts: { heading: "Sora, system-ui, sans-serif", body: "Inter, system-ui, sans-serif" },
    radius: { card: "16px", xl: "24px", pill: "999px" },
  },
  "corail-studio": {
    id: "corail-studio",
    label: "Corail pop",
    mood: ["énergique", "créatif", "solaire"],
    mode: "light",
    fontHref: `${GF}?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Figtree:wght@400;500;600&display=swap`,
    palette: { ink: "#23110e", surface: "#fffaf6", card: "#ffeee5", accent: "#e8543f", accent2: "#ffb43a", muted: "#7c6a64" },
    fonts: { heading: "'Bricolage Grotesque', system-ui, sans-serif", body: "Figtree, system-ui, sans-serif" },
    radius: { card: "24px", xl: "32px", pill: "999px" },
  },
  "mineral-precis": {
    id: "mineral-precis",
    label: "Minéral précis",
    mood: ["minimal", "précis", "premium"],
    mode: "light",
    fontHref: `${GF}?family=Space+Grotesk:wght@400;500;700&family=Manrope:wght@400;500;600;700&display=swap`,
    palette: { ink: "#16181d", surface: "#f4f4f2", card: "#e9e9e5", accent: "#3d4ed6", accent2: "#9aa3b2", muted: "#6e727b" },
    fonts: { heading: "'Space Grotesk', system-ui, sans-serif", body: "Manrope, system-ui, sans-serif" },
    radius: { card: "10px", xl: "16px", pill: "999px" },
  },
  "encre-editoriale": {
    id: "encre-editoriale",
    label: "Encre éditoriale",
    mood: ["élégant", "littéraire", "intemporel"],
    mode: "light",
    fontHref: `${GF}?family=Playfair+Display:ital,wght@0,500;0,600;1,500&family=Source+Sans+3:wght@400;600&display=swap`,
    palette: { ink: "#171411", surface: "#faf7f2", card: "#f0eadf", accent: "#b07d2e", accent2: "#2f4858", muted: "#6f6a61" },
    fonts: { heading: "'Playfair Display', Georgia, serif", body: "'Source Sans 3', system-ui, sans-serif" },
    radius: { card: "6px", xl: "12px", pill: "999px" },
  },
  "mindful-moments": {
    id: "mindful-moments",
    label: "Mindful — vert & or",
    mood: ["apaisant", "premium", "centré"],
    mode: "dark",
    fontHref: `${GF}?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500&family=Manrope:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap`,
    palette: { ink: "#F4F1EA", surface: "#16261F", card: "#22372F", accent: "#EBB552", accent2: "#F1CDBE", muted: "#9DB0A6" },
    fonts: { heading: "Fraunces, Georgia, serif", body: "Manrope, system-ui, sans-serif", label: "'JetBrains Mono', ui-monospace, monospace" },
    radius: { card: "16px", xl: "24px", pill: "999px", control: "12px" },
    density: { base: "8px", gap: "16px", cardPadding: "24px", sectionPadding: "80px" },
    texture: "grain",
    dials: { variance: 5, motion: 4, density: 5 },
    treatments: { hero: "split-editorial" },
  },
  "lexicon-creators": {
    id: "lexicon-creators",
    label: "Lexicon — créateur",
    mood: ["créatif", "énergique", "affirmé"],
    mode: "dark",
    fontHref: `${GF}?family=Syne:wght@600;700;800&family=Manrope:wght@400;500;600&family=JetBrains+Mono:wght@400;700&display=swap`,
    palette: { ink: "#FFFFFF", surface: "#0A0A0A", card: "#191C21", accent: "#F97316", accent2: "#EA580C", muted: "#A1A1AA", border: "#27272A" },
    fonts: { heading: "Syne, system-ui, sans-serif", body: "Manrope, system-ui, sans-serif", label: "'JetBrains Mono', ui-monospace, monospace" },
    radius: { card: "8px", xl: "16px", pill: "999px", control: "8px" },
    density: { base: "8px", gap: "16px", cardPadding: "24px", sectionPadding: "80px" },
    texture: "none",
    dials: { variance: 6, motion: 5, density: 6 },
    treatments: { hero: "type-giant" },
  },
  "auralis-neural": {
    id: "auralis-neural",
    label: "Auralis — tech glow",
    mood: ["tech", "lumineux", "précis"],
    mode: "light",
    fontHref: `${GF}?family=Geist:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap`,
    palette: { ink: "#111827", surface: "#FFFFFF", card: "#F2F4F7", accent: "#4F46E5", accent2: "#06B6D4", muted: "#4B5563" },
    fonts: { heading: "Geist, system-ui, sans-serif", body: "Geist, system-ui, sans-serif", label: "'JetBrains Mono', ui-monospace, monospace" },
    radius: { card: "8px", xl: "16px", pill: "999px", control: "8px" },
    density: { base: "8px", gap: "16px", cardPadding: "24px", sectionPadding: "80px" },
    texture: "glow",
    dials: { variance: 5, motion: 6, density: 5 },
    treatments: { hero: "centered-glow" },
  },
  "nexus-transfers": {
    id: "nexus-transfers",
    label: "Nexus — fintech chaude",
    mood: ["fiable", "chaleureux", "premium"],
    mode: "light",
    fontHref: `${GF}?family=Playfair+Display:wght@500;600;700&family=Manrope:wght@400;500;600&family=JetBrains+Mono:wght@400;700&display=swap`,
    palette: { ink: "#111827", surface: "#F2EAD3", card: "#FFFFFF", accent: "#F68B1F", accent2: "#FDB813", muted: "#4B5563" },
    fonts: { heading: "'Playfair Display', Georgia, serif", body: "Manrope, system-ui, sans-serif", label: "'JetBrains Mono', ui-monospace, monospace" },
    radius: { card: "16px", xl: "24px", pill: "999px", control: "8px" },
    density: { base: "8px", gap: "16px", cardPadding: "24px", sectionPadding: "80px" },
    texture: "none",
    dials: { variance: 5, motion: 4, density: 5 },
    treatments: { hero: "split-editorial" },
  },
  "neurosync": {
    id: "neurosync",
    label: "NeuroSync — feature net",
    mood: ["structuré", "moderne", "confiant"],
    mode: "light",
    fontHref: `${GF}?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,700;12..96,800&family=Manrope:wght@400;500;600&family=JetBrains+Mono:wght@400;700&display=swap`,
    palette: { ink: "#111827", surface: "#FFFFFF", card: "#F5F6F8", accent: "#CC8066", accent2: "#334155", muted: "#4B5563" },
    fonts: { heading: "'Bricolage Grotesque', system-ui, sans-serif", body: "Manrope, system-ui, sans-serif", label: "'JetBrains Mono', ui-monospace, monospace" },
    radius: { card: "8px", xl: "16px", pill: "999px", control: "8px" },
    density: { base: "8px", gap: "16px", cardPadding: "24px", sectionPadding: "80px" },
    texture: "grid",
    dials: { variance: 6, motion: 5, density: 6 },
    treatments: { hero: "split-editorial" },
  },
  "rock-brutalist": {
    id: "rock-brutalist",
    label: "Rock — brutalist acide",
    mood: ["brut", "acide", "radical"],
    mode: "dark",
    fontHref: `${GF}?family=Anton&family=Archivo:wght@400;600;800&family=JetBrains+Mono:wght@400;700&display=swap`,
    palette: { ink: "#F4F1EA", surface: "#0B0B0B", card: "#161616", accent: "#E7FF1A", accent2: "#F4F1EA", muted: "#9A9A8F" },
    fonts: { heading: "Anton, system-ui, sans-serif", body: "Archivo, system-ui, sans-serif", label: "'JetBrains Mono', ui-monospace, monospace" },
    radius: { card: "0px", xl: "0px", pill: "0px", control: "0px" },
    density: { base: "8px", gap: "16px", cardPadding: "24px", sectionPadding: "80px" },
    texture: "grain",
    dials: { variance: 9, motion: 8, density: 7 },
    treatments: { hero: "type-giant" },
  },
  "rap-luxe": {
    id: "rap-luxe",
    label: "Rap — luxe chrome",
    mood: ["luxueux", "sombre", "exclusif"],
    mode: "dark",
    fontHref: `${GF}?family=Syne:wght@600;700;800&family=Manrope:wght@400;500;600&family=JetBrains+Mono:wght@400;700&display=swap`,
    palette: { ink: "#FFFFFF", surface: "#0A0A0A", card: "#1A1A1A", accent: "#D4AF37", accent2: "#C9C9C9", muted: "#9A9A9A" },
    fonts: { heading: "Syne, system-ui, sans-serif", body: "Manrope, system-ui, sans-serif", label: "'JetBrains Mono', ui-monospace, monospace" },
    radius: { card: "14px", xl: "22px", pill: "999px", control: "14px" },
    density: { base: "8px", gap: "16px", cardPadding: "24px", sectionPadding: "80px" },
    texture: "gradient-mesh",
    dials: { variance: 8, motion: 7, density: 5 },
    treatments: { hero: "fullscreen-photo" },
  },
  "contemporain-editorial": {
    id: "contemporain-editorial",
    label: "Contemporain — éditorial intime",
    mood: ["intime", "éditorial", "délicat"],
    mode: "light",
    fontHref: `${GF}?family=Fraunces:ital,opsz,wght@0,9..144,300;1,9..144,400&family=Work+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;700&display=swap`,
    palette: { ink: "#1F1A14", surface: "#F1EBE1", card: "#FBF7F0", accent: "#8A7A5E", accent2: "#C9863E", muted: "#6A5F50" },
    fonts: { heading: "Fraunces, Georgia, serif", body: "'Work Sans', system-ui, sans-serif", label: "'JetBrains Mono', ui-monospace, monospace" },
    radius: { card: "4px", xl: "12px", pill: "999px", control: "4px" },
    density: { base: "8px", gap: "16px", cardPadding: "24px", sectionPadding: "80px" },
    texture: "none",
    dials: { variance: 3, motion: 2, density: 4 },
    treatments: { hero: "split-editorial" },
  },
  "photographe-galerie": {
    id: "photographe-galerie",
    label: "Photographe — galerie",
    mood: ["épuré", "contemplatif", "naturel"],
    mode: "light",
    fontHref: `${GF}?family=Bricolage+Grotesque:opsz,wght@12..96,300;12..96,700;12..96,800&family=Work+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;700&display=swap`,
    palette: { ink: "#16140F", surface: "#ECE9E4", card: "#F4F2EE", accent: "#16140F", accent2: "#A89C87", muted: "#6F685C" },
    fonts: { heading: "'Bricolage Grotesque', system-ui, sans-serif", body: "'Work Sans', system-ui, sans-serif", label: "'JetBrains Mono', ui-monospace, monospace" },
    radius: { card: "2px", xl: "10px", pill: "999px", control: "2px" },
    density: { base: "8px", gap: "16px", cardPadding: "24px", sectionPadding: "80px" },
    texture: "none",
    dials: { variance: 4, motion: 2, density: 3 },
    treatments: { hero: "fullscreen-photo" },
  },
  "coach-performance": {
    id: "coach-performance",
    label: "Coach — performance",
    mood: ["dynamique", "intense", "motivant"],
    mode: "dark",
    fontHref: `${GF}?family=Bebas+Neue&family=Manrope:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap`,
    palette: { ink: "#F3F4F2", surface: "#0E0F12", card: "#181A1E", accent: "#C6FF3A", accent2: "#F3F4F2", muted: "#8B8F8A" },
    fonts: { heading: "'Bebas Neue', system-ui, sans-serif", body: "Manrope, system-ui, sans-serif", label: "'JetBrains Mono', ui-monospace, monospace" },
    radius: { card: "4px", xl: "12px", pill: "999px", control: "4px" },
    density: { base: "8px", gap: "16px", cardPadding: "24px", sectionPadding: "80px" },
    texture: "grid",
    dials: { variance: 8, motion: 8, density: 6 },
    treatments: { hero: "type-giant" },
  },
  "restaurant-nocturne": {
    id: "restaurant-nocturne",
    label: "Restaurant — nocturne",
    mood: ["raffiné", "chaleureux", "nocturne"],
    mode: "dark",
    fontHref: `${GF}?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Jost:wght@300;400;500&family=JetBrains+Mono:wght@400;700&display=swap`,
    palette: { ink: "#F3E6D6", surface: "#160D0B", card: "#241512", accent: "#C9863E", accent2: "#D9A86A", muted: "#8C7A64" },
    fonts: { heading: "'Cormorant Garamond', Georgia, serif", body: "Jost, system-ui, sans-serif", label: "'JetBrains Mono', ui-monospace, monospace" },
    radius: { card: "0px", xl: "0px", pill: "999px", control: "0px" },
    density: { base: "8px", gap: "16px", cardPadding: "24px", sectionPadding: "80px" },
    texture: "glow",
    dials: { variance: 6, motion: 4, density: 4 },
    treatments: { hero: "centered-glow" },
  },

  // --- Lot 2 : 15 DA curées (la banque où Mistral pioche en onboarding) --------
  "brume-marine": {
    id: "brume-marine",
    label: "Brume marine",
    mood: ["apaisant", "intemporel", "profond"],
    mode: "light",
    fontHref: `${GF}?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Manrope:wght@400;500;600;700&display=swap`,
    palette: { ink: "#14202e", surface: "#f4f7fa", card: "#e6eef5", accent: "#3d5a80", accent2: "#8da9c4", muted: "#5e6b7d" },
    fonts: { heading: "Fraunces, Georgia, serif", body: "Manrope, system-ui, sans-serif" },
    radius: { card: "18px", xl: "26px", pill: "999px" },
  },
  "terre-eglantier": {
    id: "terre-eglantier",
    label: "Terre d'églantier",
    mood: ["chaleureux", "organique", "doux"],
    mode: "light",
    fontHref: `${GF}?family=Playfair+Display:ital,wght@0,500;0,600;1,500&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap`,
    palette: { ink: "#2b1d17", surface: "#fbf6f1", card: "#f4e7dc", accent: "#c26b4e", accent2: "#e0a87e", muted: "#7c6a60" },
    fonts: { heading: "'Playfair Display', Georgia, serif", body: "'DM Sans', system-ui, sans-serif" },
    radius: { card: "22px", xl: "30px", pill: "999px" },
  },
  "serre-lumineuse": {
    id: "serre-lumineuse",
    label: "Lumière de serre",
    mood: ["rafraîchissant", "lumineux", "vivifiant"],
    mode: "light",
    fontHref: `${GF}?family=Instrument+Serif:ital@0;1&family=Work+Sans:wght@400;500;600&display=swap`,
    palette: { ink: "#19251b", surface: "#f4f8f2", card: "#e5efe2", accent: "#5e8c61", accent2: "#a7c6a0", muted: "#67746a" },
    fonts: { heading: "'Instrument Serif', Georgia, serif", body: "'Work Sans', system-ui, sans-serif" },
    radius: { card: "16px", xl: "24px", pill: "999px" },
  },
  "lin-poudre": {
    id: "lin-poudre",
    label: "Lin poudré",
    mood: ["délicat", "nude", "feutré"],
    mode: "light",
    fontHref: `${GF}?family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&family=Outfit:wght@400;500;600;700&display=swap`,
    palette: { ink: "#241e1a", surface: "#faf6f0", card: "#f0e7dc", accent: "#b08c73", accent2: "#d8c3b0", muted: "#786c61" },
    fonts: { heading: "Newsreader, Georgia, serif", body: "Outfit, system-ui, sans-serif" },
    radius: { card: "24px", xl: "32px", pill: "999px" },
  },
  "galerie-ivoire": {
    id: "galerie-ivoire",
    label: "Galerie ivoire",
    mood: ["épuré", "contemplatif", "minéral"],
    mode: "light",
    fontHref: `${GF}?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,700;12..96,800&family=Work+Sans:wght@400;500;600&display=swap`,
    palette: { ink: "#161310", surface: "#f3f1ec", card: "#faf8f3", accent: "#161310", accent2: "#a99e8c", muted: "#6e665b" },
    fonts: { heading: "'Bricolage Grotesque', system-ui, sans-serif", body: "'Work Sans', system-ui, sans-serif" },
    radius: { card: "4px", xl: "12px", pill: "999px" },
  },
  "noir-argentique": {
    id: "noir-argentique",
    label: "Noir argentique",
    mood: ["dramatique", "sobre", "intemporel"],
    mode: "dark",
    fontHref: `${GF}?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,700;12..96,800&family=Work+Sans:wght@400;500;600&display=swap`,
    palette: { ink: "#f2efe9", surface: "#0e0e0f", card: "#1a1a1c", accent: "#e8e4dc", accent2: "#8a8780", muted: "#9a968e" },
    fonts: { heading: "'Bricolage Grotesque', system-ui, sans-serif", body: "'Work Sans', system-ui, sans-serif" },
    radius: { card: "2px", xl: "10px", pill: "999px" },
  },
  "sable-mineral": {
    id: "sable-mineral",
    label: "Sable minéral",
    mood: ["précis", "neutre", "premium"],
    mode: "light",
    fontHref: `${GF}?family=Space+Grotesk:wght@400;500;700&family=Manrope:wght@400;500;600;700&display=swap`,
    palette: { ink: "#1d1b17", surface: "#f4f2ed", card: "#e8e4da", accent: "#b5854c", accent2: "#51606b", muted: "#6f6a5e" },
    fonts: { heading: "'Space Grotesk', system-ui, sans-serif", body: "Manrope, system-ui, sans-serif" },
    radius: { card: "10px", xl: "16px", pill: "999px" },
  },
  "braise-cuivre": {
    id: "braise-cuivre",
    label: "Braise & cuivre",
    mood: ["chaleureux", "gourmand", "nocturne"],
    mode: "dark",
    fontHref: `${GF}?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Jost:wght@300;400;500&display=swap`,
    palette: { ink: "#f4e7d8", surface: "#14100d", card: "#221913", accent: "#c0703a", accent2: "#e0a766", muted: "#927e6c" },
    fonts: { heading: "'Cormorant Garamond', Georgia, serif", body: "Jost, system-ui, sans-serif" },
    radius: { card: "6px", xl: "14px", pill: "999px" },
  },
  "bistrot-creme": {
    id: "bistrot-creme",
    label: "Bistrot crème",
    mood: ["convivial", "généreux", "maison"],
    mode: "light",
    fontHref: `${GF}?family=Playfair+Display:ital,wght@0,500;0,600;1,500&family=Source+Sans+3:wght@400;600&display=swap`,
    palette: { ink: "#211410", surface: "#fbf7ef", card: "#f2e9d9", accent: "#7c2e33", accent2: "#c2923f", muted: "#786558" },
    fonts: { heading: "'Playfair Display', Georgia, serif", body: "'Source Sans 3', system-ui, sans-serif" },
    radius: { card: "6px", xl: "12px", pill: "999px" },
  },
  "olive-table": {
    id: "olive-table",
    label: "Table d'olive",
    mood: ["méditerranéen", "naturel", "solaire"],
    mode: "light",
    fontHref: `${GF}?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap`,
    palette: { ink: "#21241a", surface: "#f7f6ee", card: "#eceadb", accent: "#6b7445", accent2: "#c77b4c", muted: "#6e6f5e" },
    fonts: { heading: "Fraunces, Georgia, serif", body: "'DM Sans', system-ui, sans-serif" },
    radius: { card: "14px", xl: "22px", pill: "999px" },
  },
  "volt-graphite": {
    id: "volt-graphite",
    label: "Volt graphite",
    mood: ["énergique", "industriel", "contrasté"],
    mode: "dark",
    fontHref: `${GF}?family=Archivo:wght@400;600;800&family=Manrope:wght@400;500;600;700&display=swap`,
    palette: { ink: "#f1f2f0", surface: "#111315", card: "#1c1f22", accent: "#ff6a2b", accent2: "#f1f2f0", muted: "#8c9196" },
    fonts: { heading: "Archivo, system-ui, sans-serif", body: "Manrope, system-ui, sans-serif" },
    radius: { card: "4px", xl: "12px", pill: "999px" },
  },
  "arena-rouge": {
    id: "arena-rouge",
    label: "Arena rouge",
    mood: ["radical", "intense", "brut"],
    mode: "dark",
    fontHref: `${GF}?family=Anton&family=Archivo:wght@400;600;800&display=swap`,
    palette: { ink: "#f3eeec", surface: "#0c0a0a", card: "#181312", accent: "#e23a2e", accent2: "#f3eeec", muted: "#9a8f8c" },
    fonts: { heading: "Anton, system-ui, sans-serif", body: "Archivo, system-ui, sans-serif" },
    radius: { card: "0px", xl: "0px", pill: "999px" },
  },
  "ardoise-azur": {
    id: "ardoise-azur",
    label: "Ardoise azur",
    mood: ["clair", "structuré", "confiant"],
    mode: "light",
    fontHref: `${GF}?family=Geist:wght@400;500;600;700&display=swap`,
    palette: { ink: "#131a22", surface: "#f5f7f9", card: "#e7ecf1", accent: "#2d6fb0", accent2: "#6fa3d1", muted: "#5c6773" },
    fonts: { heading: "Geist, system-ui, sans-serif", body: "Geist, system-ui, sans-serif" },
    radius: { card: "8px", xl: "16px", pill: "999px" },
  },
  "rose-chrome": {
    id: "rose-chrome",
    label: "Rose chrome",
    mood: ["raffiné", "actuel", "sophistiqué"],
    mode: "dark",
    fontHref: `${GF}?family=Syne:wght@600;700;800&family=Manrope:wght@400;500;600;700&display=swap`,
    palette: { ink: "#f4eef0", surface: "#0b0a0b", card: "#1a171a", accent: "#d98aa8", accent2: "#c8c8cc", muted: "#9a9298" },
    fonts: { heading: "Syne, system-ui, sans-serif", body: "Manrope, system-ui, sans-serif" },
    radius: { card: "14px", xl: "22px", pill: "999px" },
  },
  "acier-brique": {
    id: "acier-brique",
    label: "Acier & brique",
    mood: ["fiable", "robuste", "direct"],
    mode: "light",
    fontHref: `${GF}?family=Space+Grotesk:wght@400;500;700&family=Manrope:wght@400;500;600;700&display=swap`,
    palette: { ink: "#161a1d", surface: "#f4f5f6", card: "#e6e9eb", accent: "#355c7d", accent2: "#b5572f", muted: "#5f6a72" },
    fonts: { heading: "'Space Grotesk', system-ui, sans-serif", body: "Manrope, system-ui, sans-serif" },
    radius: { card: "6px", xl: "12px", pill: "999px" },
  },
} as Record<VibeId, Vibe>);

/** Tous les ids de vibe (ordre stable d'affichage). */
export const VIBE_IDS = Object.keys(VIBES) as VibeId[];

export function getVibe(id: string): Vibe | undefined {
  return (VIBES as Record<string, Vibe>)[id];
}

export function listVibes(): Vibe[] {
  return VIBE_IDS.map((id) => VIBES[id]);
}

/** Border dérivée si non fournie : encre fondue à 82 % dans la surface. */
function deriveBorder(vibe: Vibe): string {
  if (vibe.palette.border) return vibe.palette.border;
  const hx = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)] as const;
  const to = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  const a = hx(vibe.palette.ink), b = hx(vibe.palette.surface), t = 0.82;
  return `#${to(a[0] + (b[0] - a[0]) * t)}${to(a[1] + (b[1] - a[1]) * t)}${to(a[2] + (b[2] - a[2]) * t)}`;
}

const DEFAULT_DENSITY = { base: "8px", gap: "16px", cardPadding: "24px", sectionPadding: "80px" };
const MONO_FALLBACK = "'JetBrains Mono', ui-monospace, monospace";

/** Couleur de texte lisible SUR une couleur donnée (noir ou blanc selon la
 *  luminance perçue). Sert à `--c-on-accent` : un texte posé sur le fond accent
 *  reste lisible même quand l'accent est vif/clair (lime, or, acide…). */
function readableOn(hex: string): string {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return "#ffffff";
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.55 ? "#111111" : "#ffffff";
}

export function vibeToCssVars(vibe: Vibe, brand?: { primary?: string }): Record<string, string> {
  const brandPrimary = brand?.primary?.trim();
  const primary = brandPrimary ? brandPrimary : vibe.palette.accent;
  const d = vibe.density ?? DEFAULT_DENSITY;
  // Panneau « contraste » : une section volontairement sombre (héros dramatique,
  // bandeau, footer…). Doit rester SOMBRE dans les deux modes — en mode clair
  // c'est l'encre (panneau foncé sur page claire) ; en mode sombre c'est la carte
  // (sombre surélevé, sinon `--c-ink` vire au clair et inverse le panneau).
  const isDark = vibe.mode === "dark";
  const panel = isDark ? vibe.palette.card : vibe.palette.ink;
  const onPanel = isDark ? vibe.palette.ink : vibe.palette.surface;
  return {
    // --- Anciennes vars (INCHANGÉES) ---
    "--c-ink": vibe.palette.ink,
    "--c-surface": vibe.palette.surface,
    "--c-card": vibe.palette.card,
    "--c-accent": primary,
    "--c-accent2": vibe.palette.accent2,
    "--c-muted": vibe.palette.muted,
    "--font-heading": vibe.fonts.heading,
    "--font-body": vibe.fonts.body,
    "--r-card": vibe.radius.card,
    "--r-xl": vibe.radius.xl,
    "--r-pill": vibe.radius.pill,
    // --- Nouvelles vars sémantiques ---
    "--c-primary": primary,
    "--c-secondary": vibe.palette.accent2,
    "--c-accent3": vibe.palette.accent3 ?? vibe.palette.accent2,
    "--c-on-accent": readableOn(primary),
    "--c-bg": vibe.palette.surface,
    "--c-text": vibe.palette.ink,
    "--c-text-2": vibe.palette.muted,
    "--c-border": deriveBorder(vibe),
    // Panneau contraste (sombre dans les 2 modes) + texte lisible dessus.
    "--c-panel": panel,
    "--c-on-panel": onPanel,
    "--font-label": vibe.fonts.label ?? MONO_FALLBACK,
    "--space-base": d.base,
    "--space-gap": d.gap,
    "--space-card": d.cardPadding,
    "--space-section": d.sectionPadding,
    "--r-control": vibe.radius.control ?? vibe.radius.card,
    "--shadow-card": vibe.shape?.shadowCard ?? "0 1px 2px rgba(0,0,0,.06)",
    "--btn-radius": vibe.radius.control ?? vibe.radius.pill,
  };
}
