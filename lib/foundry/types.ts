// lib/foundry/types.ts
export type VibeId = "warm-serif";

export interface Vibe {
  id: VibeId;
  palette: { ink: string; surface: string; card: string; accent: string; accent2: string; muted: string };
  fonts: { heading: string; body: string };
  radius: { card: string; xl: string; pill: string };
}

export type SkinKey = "accent" | "surface" | "card" | "headingFont";
export type Skin = Partial<Record<SkinKey, string>>;

export interface ComponentManifest {
  id: string;
  role: string;
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
  vibe: VibeId;
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
