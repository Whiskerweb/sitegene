// lib/foundry/library/index.ts
// AGRÉGATEUR des modules d'extraction (un module = un lot de sites sources).
// Chaque module exporte { manifests, samples } ; les composants React associés
// vivent dans components/foundry/library/<lot>.tsx. Ce fichier est câblé À LA
// MAIN après chaque vague d'extraction — les agents d'extraction n'y touchent pas.
import type { ComponentManifest } from "../types";
import * as artisansA from "./artisans-a";
import * as navbarsA from "./navbars-a";

export interface LibraryModule {
  manifests: Record<string, ComponentManifest>;
  samples: Record<string, Record<string, unknown>>;
}

const MODULES: LibraryModule[] = [artisansA, navbarsA];

export const LIBRARY_MANIFESTS: Record<string, ComponentManifest> = Object.assign(
  {},
  ...MODULES.map((m) => m.manifests),
);

export const LIBRARY_SAMPLES: Record<string, Record<string, unknown>> = Object.assign(
  {},
  ...MODULES.map((m) => m.samples),
);
