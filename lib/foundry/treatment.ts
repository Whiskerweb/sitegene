// lib/foundry/treatment.ts
import type { Vibe, HeroTreatment } from "./types";

/** Traitement hero imposé par la DA (défaut si non déclaré). */
export function heroTreatmentOf(vibe: Vibe): HeroTreatment {
  return vibe.treatments?.hero ?? "default";
}
