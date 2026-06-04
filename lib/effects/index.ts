/**
 * Registre des effets de la page Formules.
 *
 * Le catalogue est rempli UNIQUEMENT avec des effets fournis par l'équipe
 * (composants React/Tailwind adaptés en modules vanilla : voir types.ts).
 * Pour ajouter un effet :
 *  1. créer lib/effects/<id>.ts exportant un EffectModule (css/js vanilla,
 *     htmlSnippet si markup, aiGuide = solution d'intégration pour l'IA) ;
 *  2. l'enregistrer ci-dessous (+ sa config de démo) ;
 *  3. vérifier sa démo réelle sur /api/fx-demo?id=<id>.
 */
import type { EffectConfig, EffectModule } from "./types";
import { containerScroll, containerScrollDemoConfig } from "./container-scroll";
import { displayCards, displayCardsDemoConfig } from "./display-cards";
import { shuffleTestimonials, shuffleTestimonialsDemoConfig } from "./shuffle-testimonials";
import { circularTestimonials, circularTestimonialsDemoConfig } from "./circular-testimonials";
import { staggerTestimonials, staggerTestimonialsDemoConfig } from "./stagger-testimonials";

const ALL: EffectModule[] = [
  containerScroll,
  displayCards,
  shuffleTestimonials,
  circularTestimonials,
  staggerTestimonials,
];

/** Surcharges de config pour la page de démo (/api/fx-demo). */
export const DEMO_CONFIGS: Record<string, EffectConfig> = {
  [containerScroll.id]: containerScrollDemoConfig,
  [displayCards.id]: displayCardsDemoConfig,
  [shuffleTestimonials.id]: shuffleTestimonialsDemoConfig,
  [circularTestimonials.id]: circularTestimonialsDemoConfig,
  [staggerTestimonials.id]: staggerTestimonialsDemoConfig,
};

export const EFFECTS: Record<string, EffectModule> = Object.fromEntries(
  ALL.map((e) => [e.id, e]),
);

export function getEffect(id: string): EffectModule | undefined {
  return EFFECTS[id];
}

export function listEffects(): EffectModule[] {
  return ALL;
}
