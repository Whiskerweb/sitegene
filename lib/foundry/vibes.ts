// lib/foundry/vibes.ts
// Directions artistiques de la fonderie. Une vibe = palette + paire typographique
// + radius + ambiance. Les composants étant pilotés par CSS vars, toute vibe
// s'applique à tout composant ; la personnalité vient des tokens, jamais du markup.
// Surfaces volontairement CLAIRES (contraste garanti sur les 13 composants).
import type { Vibe, VibeId } from "./types";

const GF = "https://fonts.googleapis.com/css2";

export const VIBES: Record<VibeId, Vibe> = {
  "warm-serif": {
    id: "warm-serif",
    label: "Atelier chaleureux",
    mood: ["chaleureux", "humain", "artisanal"],
    fontHref: `${GF}?family=Castoro:ital@0;1&family=Nunito:wght@400;600;700;800&display=swap`,
    palette: { ink: "#0d0503", surface: "#fcfaf7", card: "#f8f3ec", accent: "#8d6959", accent2: "#e1937d", muted: "#70747a" },
    fonts: { heading: "Castoro, Georgia, serif", body: "Nunito, system-ui, sans-serif" },
    radius: { card: "24px", xl: "32px", pill: "999px" },
  },
  "sage-nature": {
    id: "sage-nature",
    label: "Sauge & lin",
    mood: ["apaisant", "naturel", "organique"],
    fontHref: `${GF}?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Outfit:wght@400;500;600;700&display=swap`,
    palette: { ink: "#1c2419", surface: "#f7faf4", card: "#ecf2e6", accent: "#5a7d52", accent2: "#c8a96e", muted: "#6f7a6a" },
    fonts: { heading: "Fraunces, Georgia, serif", body: "Outfit, system-ui, sans-serif" },
    radius: { card: "20px", xl: "28px", pill: "999px" },
  },
  "ocean-confiance": {
    id: "ocean-confiance",
    label: "Bleu de travail",
    mood: ["fiable", "net", "professionnel"],
    fontHref: `${GF}?family=Sora:wght@400;600;700&family=Inter:wght@400;500;600&display=swap`,
    palette: { ink: "#0c1626", surface: "#f6f9fc", card: "#e9f0f8", accent: "#2456e6", accent2: "#6ea8fe", muted: "#5d6b80" },
    fonts: { heading: "Sora, system-ui, sans-serif", body: "Inter, system-ui, sans-serif" },
    radius: { card: "16px", xl: "24px", pill: "999px" },
  },
  "corail-studio": {
    id: "corail-studio",
    label: "Corail pop",
    mood: ["énergique", "créatif", "solaire"],
    fontHref: `${GF}?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Figtree:wght@400;500;600&display=swap`,
    palette: { ink: "#23110e", surface: "#fffaf6", card: "#ffeee5", accent: "#e8543f", accent2: "#ffb43a", muted: "#7c6a64" },
    fonts: { heading: "'Bricolage Grotesque', system-ui, sans-serif", body: "Figtree, system-ui, sans-serif" },
    radius: { card: "24px", xl: "32px", pill: "999px" },
  },
  "mineral-precis": {
    id: "mineral-precis",
    label: "Minéral précis",
    mood: ["minimal", "précis", "premium"],
    fontHref: `${GF}?family=Space+Grotesk:wght@400;500;700&family=Manrope:wght@400;500;600;700&display=swap`,
    palette: { ink: "#16181d", surface: "#f4f4f2", card: "#e9e9e5", accent: "#3d4ed6", accent2: "#9aa3b2", muted: "#6e727b" },
    fonts: { heading: "'Space Grotesk', system-ui, sans-serif", body: "Manrope, system-ui, sans-serif" },
    radius: { card: "10px", xl: "16px", pill: "999px" },
  },
  "encre-editoriale": {
    id: "encre-editoriale",
    label: "Encre éditoriale",
    mood: ["élégant", "littéraire", "intemporel"],
    fontHref: `${GF}?family=Playfair+Display:ital,wght@0,500;0,600;1,500&family=Source+Sans+3:wght@400;600&display=swap`,
    palette: { ink: "#171411", surface: "#faf7f2", card: "#f0eadf", accent: "#b07d2e", accent2: "#2f4858", muted: "#6f6a61" },
    fonts: { heading: "'Playfair Display', Georgia, serif", body: "'Source Sans 3', system-ui, sans-serif" },
    radius: { card: "6px", xl: "12px", pill: "999px" },
  },
};

/** Tous les ids de vibe (ordre stable d'affichage). */
export const VIBE_IDS = Object.keys(VIBES) as VibeId[];

export function getVibe(id: string): Vibe | undefined {
  return (VIBES as Record<string, Vibe>)[id];
}

export function listVibes(): Vibe[] {
  return VIBE_IDS.map((id) => VIBES[id]);
}

export function vibeToCssVars(vibe: Vibe, brand?: { primary?: string }): Record<string, string> {
  // Une couleur de marque vide/blanche n'est pas une surcharge : on retombe sur la vibe.
  const brandPrimary = brand?.primary?.trim();
  return {
    "--c-ink": vibe.palette.ink,
    "--c-surface": vibe.palette.surface,
    "--c-card": vibe.palette.card,
    "--c-accent": brandPrimary ? brandPrimary : vibe.palette.accent,
    "--c-accent2": vibe.palette.accent2,
    "--c-muted": vibe.palette.muted,
    "--font-heading": vibe.fonts.heading,
    "--font-body": vibe.fonts.body,
    "--r-card": vibe.radius.card,
    "--r-xl": vibe.radius.xl,
    "--r-pill": vibe.radius.pill,
  };
}
