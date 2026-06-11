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

export function vibeToCssVars(vibe: Vibe, brand?: { primary?: string }): Record<string, string> {
  const brandPrimary = brand?.primary?.trim();
  const primary = brandPrimary ? brandPrimary : vibe.palette.accent;
  const d = vibe.density ?? DEFAULT_DENSITY;
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
    "--c-bg": vibe.palette.surface,
    "--c-text": vibe.palette.ink,
    "--c-text-2": vibe.palette.muted,
    "--c-border": deriveBorder(vibe),
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
