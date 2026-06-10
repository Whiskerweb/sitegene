// components/foundry/library/index.ts
// AGRÉGATEUR des composants React extraits (un module .tsx par lot de sites).
// Câblé À LA MAIN après chaque vague d'extraction (jamais par les agents).
import type { ComponentType } from "react";
import type { Skin } from "@/lib/foundry/types";

export type FoundryComponent = ComponentType<{ content: any; skin: Skin }>;

const MODULES: Array<Record<string, FoundryComponent>> = [];

export const LIBRARY_COMPONENTS: Record<string, FoundryComponent> = Object.assign(
  {},
  ...MODULES,
);
