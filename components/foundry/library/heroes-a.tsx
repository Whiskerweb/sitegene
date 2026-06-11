// components/foundry/library/heroes-a.tsx
// Composants du LOT « heroes-a » : heros extraits de nos templates (portfolio,
// musicien, mariage/photographe, artisans). Fichiers déjà présents (extraction
// antérieure), ici enfin câblés au catalogue.
import type { ComponentType } from "react";
import type { Skin } from "@/lib/foundry/types";
import CreativePortfolioHero from "../components/CreativePortfolioHero";
import StudioPortfolioHero from "../components/StudioPortfolioHero";
import JazzVocalistHero from "../components/JazzVocalistHero";
import LuxuryWeddingHero from "../components/LuxuryWeddingHero";
import WwHeroFullscreen from "../components/WwHeroFullscreen";
import ElectricianProHero from "../components/ElectricianProHero";
import MultiTradeHero from "../components/MultiTradeHero";

type C = ComponentType<{ content: any; skin: Skin }>;

export const COMPONENTS_HEROES_A: Record<string, C> = {
  "creative-portfolio-hero": CreativePortfolioHero as C,
  "studio-portfolio-hero": StudioPortfolioHero as C,
  "jazz-vocalist-hero": JazzVocalistHero as C,
  "luxury-wedding-hero": LuxuryWeddingHero as C,
  "wedding-warm-hero": WwHeroFullscreen as C,
  "electrician-pro-hero": ElectricianProHero as C,
  "multi-trade-hero": MultiTradeHero as C,
};
