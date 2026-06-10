// lib/foundry/types.ts
export type VibeId =
  | "warm-serif"
  | "sage-nature"
  | "ocean-confiance"
  | "corail-studio"
  | "mineral-precis"
  | "encre-editoriale";

export interface Vibe {
  /** Id d'une vibe curée, ou "custom" pour une charte générée sur mesure. */
  id: VibeId | "custom";
  /** Nom de palette montré au client (carte DA de l'onboarding). */
  label: string;
  /** 3 mots d'ambiance (carte DA). */
  mood: string[];
  /** Feuille Google Fonts chargée par l'Assembler (heading + body de la vibe). */
  fontHref: string;
  palette: { ink: string; surface: string; card: string; accent: string; accent2: string; muted: string };
  fonts: { heading: string; body: string };
  radius: { card: string; xl: string; pill: string };
}

export type SkinKey = "accent" | "surface" | "card" | "headingFont";
export type Skin = Partial<Record<SkinKey, string>>;

/**
 * Palier de rareté (marketplace) — attribué à l'extraction, par jugement humain :
 *  - common : section propre et statique (FAQ, bandeau, texte). Belle mais "normale".
 *  - rare   : parti pris design fort OU animation au scroll (avis en carrousel, reveal…).
 *  - epic   : composant signature "waouh" qui fait la différence sur un site.
 */
export type Rarity = "common" | "rare" | "epic";

export interface ComponentManifest {
  id: string;
  role: string;                 // CATÉGORIE / rôle de section : hero, services, reviews, pricing, contact, faq, banner, carousel, footer…
  rarity: Rarity;               // palier marketplace (pilote le prix + le mix choisi par Mistral)
  description: string;
  whenToUse: string[];
  vibes: VibeId[];
  contentKeys: string[];        // clés de contenu REQUISES
  allowedSkinKeys: SkinKey[];   // clés de peau que ce composant honore
}

export interface RecipeSection {
  component: string;
  content: Record<string, unknown>;
  skin?: Skin;
}

export interface Recipe {
  /** Id de vibe curée, ou "custom" si customVibe est embarquée. */
  vibe: string;
  /** Charte sur mesure (générée par l'IA, réparée serveur) — prime sur `vibe`. */
  customVibe?: Vibe;
  brand?: { primary?: string; logo?: string };
  sections: RecipeSection[];
}

export interface ResolvedSection {
  manifest: ComponentManifest;
  content: Record<string, unknown>;
  skin: Skin;
}

export interface RecipeValidation {
  ok: boolean;
  errors: string[];
  resolved: ResolvedSection[];
}
