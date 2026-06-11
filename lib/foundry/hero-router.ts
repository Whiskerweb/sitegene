// lib/foundry/hero-router.ts
// Résolution du composant hero (et des navbars) adapté au couple (métier, DA).
// Importé par agenceur.ts pour filtrer le catalogue et guider Mistral.
import type { VibeId } from "./types";
import type { TradeId } from "./da-personas";

/** Heroes disponibles par métier (ordre : recommandé en premier). */
const TRADE_HERO_OPTIONS: Record<TradeId, string[]> = {
  musicien:    ["jazz-vocalist-hero", "creative-portfolio-hero", "bold-stack-hero", "studio-portfolio-hero"],
  photographe: ["studio-portfolio-hero", "luxury-wedding-hero", "marquee-hero"],
  artisan:     ["electrician-pro-hero", "multi-trade-hero", "plumber-pro-hero"],
  coach:       ["hero-split-asym"],
  "bien-etre": ["hero-split-asym"],
  restaurant:  ["hero-split-asym"],
  beaute:      ["hero-split-asym"],
  conseil:     ["hero-split-asym"],
  fitness:     ["hero-split-asym"],
  autre:       ["hero-split-asym"],
};

/** Override : vibeId → trade → hero recommandé (prime sur le premier de la liste). */
const VIBE_HERO_OVERRIDE: Partial<Record<VibeId, Partial<Record<TradeId, string>>>> = {
  "rock-brutalist":         { musicien: "creative-portfolio-hero" },
  "lexicon-creators":       { musicien: "creative-portfolio-hero", artisan: "multi-trade-hero" },
  "rap-luxe":               { musicien: "bold-stack-hero" },
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
  artisan:     new Set(["jazz-vocalist-hero", "creative-portfolio-hero", "bold-stack-hero", "studio-portfolio-hero", "luxury-wedding-hero", "wedding-warm-hero", "marquee-hero"]),
  coach:       new Set(["jazz-vocalist-hero", "creative-portfolio-hero", "bold-stack-hero", "studio-portfolio-hero", "luxury-wedding-hero", "wedding-warm-hero", "electrician-pro-hero", "multi-trade-hero", "plumber-pro-hero", "plumber-modern-hero", "plumber-emergency-hero"]),
  "bien-etre": new Set(["jazz-vocalist-hero", "creative-portfolio-hero", "bold-stack-hero", "studio-portfolio-hero", "luxury-wedding-hero", "wedding-warm-hero", "electrician-pro-hero", "multi-trade-hero", "plumber-pro-hero", "plumber-modern-hero", "plumber-emergency-hero"]),
  restaurant:  new Set(["jazz-vocalist-hero", "creative-portfolio-hero", "bold-stack-hero", "studio-portfolio-hero", "luxury-wedding-hero", "wedding-warm-hero", "electrician-pro-hero", "multi-trade-hero", "plumber-pro-hero", "plumber-modern-hero", "plumber-emergency-hero"]),
  beaute:      new Set(["jazz-vocalist-hero", "creative-portfolio-hero", "bold-stack-hero", "studio-portfolio-hero", "luxury-wedding-hero", "wedding-warm-hero", "electrician-pro-hero", "multi-trade-hero", "plumber-pro-hero", "plumber-modern-hero", "plumber-emergency-hero"]),
  conseil:     new Set(["jazz-vocalist-hero", "creative-portfolio-hero", "bold-stack-hero", "studio-portfolio-hero", "luxury-wedding-hero", "wedding-warm-hero", "electrician-pro-hero", "multi-trade-hero", "plumber-pro-hero", "plumber-modern-hero", "plumber-emergency-hero"]),
  fitness:     new Set(["jazz-vocalist-hero", "creative-portfolio-hero", "bold-stack-hero", "studio-portfolio-hero", "luxury-wedding-hero", "wedding-warm-hero", "electrician-pro-hero", "multi-trade-hero", "plumber-pro-hero", "plumber-modern-hero", "plumber-emergency-hero"]),
  autre:       new Set(["jazz-vocalist-hero", "studio-portfolio-hero", "luxury-wedding-hero", "wedding-warm-hero", "electrician-pro-hero", "multi-trade-hero", "plumber-pro-hero", "plumber-modern-hero", "plumber-emergency-hero"]),
};

/** Navbars hors-contexte pour tous les métiers sauf leur liste propre. */
const NAVBAR_TRADE_SETS: Record<TradeId, Set<string>> = Object.fromEntries(
  Object.entries(TRADE_NAVBAR_OPTIONS).map(([t, ids]) => [t, new Set(ids)])
) as Record<TradeId, Set<string>>;

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
  return false;
}
