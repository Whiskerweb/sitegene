// components/foundry/studio/types.ts
// Types d'échange serveur → éditeur « L'Atelier » (tout est sérialisable JSON).
import type { Vibe, Rarity } from "@/lib/foundry/types";

/** Vibe sérialisée (preset ou charte sur mesure) — même forme que lib Vibe. */
export type StudioVibe = Vibe;

export interface StudioSection {
  component: string;
  role: string;
  roleLabel: string;
  rarity: Rarity;
  content: Record<string, unknown>;
}

/** Une pièce du catalogue, vue éditeur (remplacement + ajout). */
export interface CatalogEntry {
  id: string;
  label: string;
  role: string;
  roleLabel: string;
  rarity: Rarity;
  /** Crédits pour débloquer (0 = inclus). */
  price: number;
  owned: boolean;
  /** Contenu d'exemple (pour l'aperçu sur la charte du client). */
  sample: Record<string, unknown>;
}

/** Onglet de page dans l'éditeur (accueil + sous-pages). */
export interface PageTab {
  id: string;
  title: string;
  slug: string;
}

export interface StudioData {
  siteId: string;
  slug: string | null;
  isLive: boolean;
  locked: boolean;
  hasUnpublished: boolean;
  balance: number;
  businessName: string;
  sections: StudioSection[];
  vibe: StudioVibe;
  brandPrimary: string | null;
  catalog: CatalogEntry[];
  presets: StudioVibe[];
  fonts: { heading: string[]; body: string[] };
  mediaBank: string[];
  /** Sous-pages du site (onglets). */
  pages: PageTab[];
  /** Page en cours d'édition : null = accueil, sinon id de sous-page. */
  pageId: string | null;
  /** Titre de la page courante (sous-page). */
  pageTitle: string | null;
}
