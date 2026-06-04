/**
 * Contrat d'un effet (animation/composant) vendu sur la page Formules.
 *
 * Chaque effet du catalogue est fourni par l'équipe (code source réel, déposé
 * dans lib/effects/<id>.ts après adaptation vanilla) — jamais stocké en base,
 * jamais généré par l'IA. La base ne connaît que l'ownership
 * (marketplace_items) et les références appliquées dans content_json
 * (__effects / __components). Le seul input externe est la `config` (valeurs
 * typées), validée par sanitizeEffectConfig contre le configSchema avant
 * toute persistance.
 *
 * Deux faces par effet :
 *  - la face CLIENT : css/js/htmlSnippet (le rendu) + la démo réelle
 *    (/api/fx-demo?id=<id> rend l'effet exact dans une page sandbox) ;
 *  - la face IA : `aiGuide` — la solution d'intégration (où ancrer l'effet,
 *    comment choisir position/config, pièges connus). Injectée dans le prompt
 *    de proposeComponentIntegration, JAMAIS renvoyée au client.
 */

/**
 * - "global"    : s'applique à tout le site (curseur, reveals…) → content.__effects
 * - "component" : ancré à une section choisie dans l'éditeur → content.__components
 */
export type EffectKind = "global" | "component";

/** Position d'insertion d'un composant par rapport à la section ciblée. */
export type ComponentPosition = "replace" | "before" | "after" | "inside";

export const COMPONENT_POSITIONS: readonly ComponentPosition[] = [
  "replace",
  "before",
  "after",
  "inside",
];

export type EffectConfigField =
  | { key: string; label: string; type: "color"; default: string }
  | { key: string; label: string; type: "number"; default: number; min: number; max: number }
  | { key: string; label: string; type: "select"; default: string; options: readonly string[] }
  | { key: string; label: string; type: "boolean"; default: boolean }
  | { key: string; label: string; type: "text"; default: string; maxLen: number }
  /** URL http(s) ou chemin absolu du site (ex. photo existante du client). */
  | { key: string; label: string; type: "url"; default: string };

export type EffectConfig = Record<string, string | number | boolean>;

export interface EffectModule {
  id: string;
  name: string;
  description: string;
  kind: EffectKind;
  /** false → exclu du rendu et du popover pour la lignée SPA (Vite). */
  spaCompatible: boolean;
  /** CSS injecté dans <style id="sg-fx"> (classes préfixées sg-fx-). */
  css: string;
  /**
   * JS vanilla : IIFE qui push {id, init(cfg)} dans window.__SG_FX_INIT__ ;
   * l'injecteur (FX_INJECTOR) appelle init après insertion des markups.
   * Idempotent, zéro dépendance, respecte prefers-reduced-motion.
   */
  js?: string;
  /** Markup d'un composant (construit CÔTÉ SERVEUR avec la config sanitizée). */
  htmlSnippet?: (config: EffectConfig) => string;
  /** Position suggérée à l'IA quand la demande est ambiguë. */
  defaultPosition?: ComponentPosition;
  configSchema?: EffectConfigField[];
  /**
   * SOLUTION D'INTÉGRATION CÔTÉ IA (jamais exposée au client) : ce que fait
   * l'effet, sur quel type de section il fonctionne le mieux, quelle position
   * privilégier, comment adapter la config à la DA du site, pièges connus.
   */
  aiGuide: string;
  /**
   * Markup hôte minimal de la page de démo (/api/fx-demo) : l'effet RÉEL
   * (css+js+htmlSnippet) y est appliqué — la prévisualisation n'est pas une
   * imitation. `bg` = fond de la page sandbox.
   */
  demo: { html: string; bg?: string };
  /** Dégradé d'accent pour les pastilles compactes (popover éditeur, chips). */
  accent: { from: string; to: string };
}

/** Échappe une valeur texte de config insérée dans un htmlSnippet. */
export function escapeFxHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Config par défaut dérivée du schéma. */
export function defaultConfig(effect: EffectModule): EffectConfig {
  const out: EffectConfig = {};
  for (const f of effect.configSchema ?? []) out[f.key] = f.default;
  return out;
}
