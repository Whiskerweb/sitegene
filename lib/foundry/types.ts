// lib/foundry/types.ts
export type VibeId =
  | "warm-serif"
  | "sage-nature"
  | "ocean-confiance"
  | "corail-studio"
  | "mineral-precis"
  | "encre-editoriale"
  // --- Lot 1 : 11 DA enrichies ---
  | "mindful-moments"
  | "lexicon-creators"
  | "auralis-neural"
  | "nexus-transfers"
  | "neurosync"
  | "rock-brutalist"
  | "rap-luxe"
  | "contemporain-editorial"
  | "photographe-galerie"
  | "coach-performance"
  | "restaurant-nocturne"
  // --- Lot 2 : 15 DA curées (enrichissement banque onboarding) ---
  | "brume-marine"
  | "terre-eglantier"
  | "serre-lumineuse"
  | "lin-poudre"
  | "galerie-ivoire"
  | "noir-argentique"
  | "sable-mineral"
  | "braise-cuivre"
  | "bistrot-creme"
  | "olive-table"
  | "volt-graphite"
  | "arena-rouge"
  | "ardoise-azur"
  | "rose-chrome"
  | "acier-brique";

export type HeroTreatment = "default" | "split-editorial" | "fullscreen-photo" | "type-giant" | "centered-glow";
export type Texture = "none" | "grain" | "grid" | "glow" | "gradient-mesh";

export interface Vibe {
  id: VibeId | "custom";
  label: string;
  mood: string[];
  fontHref: string;
  palette: {
    ink: string; surface: string; card: string; accent: string; accent2: string; muted: string;
    /** Rôles supplémentaires (optionnels — dérivés si absents). */
    accent3?: string; border?: string;
  };
  fonts: { heading: string; body: string; /** face mono pour labels/métadonnées */ label?: string };
  radius: { card: string; xl: string; pill: string; /** rayon des contrôles (champs/boutons) */ control?: string };
  /** Clair (texte sombre/fond clair) ou sombre (texte clair/fond sombre). Défaut: "light". */
  mode?: "light" | "dark";
  /** Densité (dial). Défaut: medium. */
  density?: { base: string; gap: string; cardPadding: string; sectionPadding: string };
  /** Forme/relief. */
  shape?: { shadowCard?: string; buttonStyle?: "solid" | "outline" | "ghost" };
  /** Atmosphère de fond (CSS-only en Lot 1). */
  texture?: Texture;
  /** Dials taste-skill (1..10). */
  dials?: { variance: number; motion: number; density: number };
  /** Traitements de section imposés par la DA. */
  treatments?: { hero?: HeroTreatment };
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

/**
 * Métadonnées d'aperçu d'une section (jamais rendues sur le site publié).
 * `placeholder` : la section tourne sur des données d'exemple/inventées par l'IA
 * (avis, chiffres, visuels) que le client doit personnaliser. L'aperçu et
 * l'éditeur l'entourent d'un cadre + un badge ; le site en ligne les ignore.
 */
export interface SectionMeta {
  placeholder?: boolean;
  /** Message court affiché dans le badge (« Avis d'exemple — … »). */
  reason?: string;
}

export interface RecipeSection {
  component: string;
  content: Record<string, unknown>;
  skin?: Skin;
  meta?: SectionMeta;
}

export interface Recipe {
  /** Id de vibe curée, ou "custom" si customVibe est embarquée. */
  vibe: string;
  /** Charte sur mesure (générée par l'IA, réparée serveur) — prime sur `vibe`. */
  customVibe?: Vibe;
  /**
   * Id de la charte PERSONNELLE active (table user_chartes), si la charte custom
   * en cours provient d'une charte enregistrée par l'utilisateur. Permet à
   * l'éditeur de distinguer « modifier une charte de base » (→ enregistrer crée
   * une nouvelle charte) de « modifier sa propre charte » (→ met à jour). Effacé
   * dès qu'un preset de base est choisi.
   */
  userCharteId?: string;
  brand?: { primary?: string; logo?: string };
  sections: RecipeSection[];
}

export interface ResolvedSection {
  manifest: ComponentManifest;
  content: Record<string, unknown>;
  skin: Skin;
  /** Repris tel quel de la section source (badge « données d'exemple » en aperçu). */
  meta?: SectionMeta;
}

export interface RecipeValidation {
  ok: boolean;
  errors: string[];
  resolved: ResolvedSection[];
}
