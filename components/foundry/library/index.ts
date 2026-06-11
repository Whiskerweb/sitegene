// components/foundry/library/index.ts
// AGRÉGATEUR des composants React extraits (un module .tsx par lot de sites).
// Câblé À LA MAIN après chaque vague d'extraction (jamais par les agents).
import type { ComponentType } from "react";
import type { Skin } from "@/lib/foundry/types";
import { COMPONENTS_ARTISANS_A } from "./artisans-a";
import { COMPONENTS_NAVBARS_A } from "./navbars-a";
import { COMPONENTS_IMPORTED_A } from "./imported-a";
import { COMPONENTS_HEROES_A } from "./heroes-a";

export type FoundryComponent = ComponentType<{ content: any; skin: Skin }>;

const MODULES: Array<Record<string, FoundryComponent>> = [COMPONENTS_ARTISANS_A, COMPONENTS_NAVBARS_A, COMPONENTS_IMPORTED_A, COMPONENTS_HEROES_A];

export const LIBRARY_COMPONENTS: Record<string, FoundryComponent> = Object.assign(
  {},
  ...MODULES,
);
